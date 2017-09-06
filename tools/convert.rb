#!/usr/bin/env ruby

# This script converts data from old eScholarship into the new eschol5 database.
#
# The "--units" mode converts the contents of allStruct-eschol5.xml and the
# various brand files into the unit/unitHier/etc tables. It is
# built to be fully incremental.
#
# The "--items" mode converts combined an XTF index dump with the contents of
# UCI metadata files into the items/sections/issues/etc. tables. It is also
# built to be fully incremental.

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'aws-sdk'
require 'date'
require 'digest'
require 'fastimage'
require 'httparty'
require 'json'
require 'logger'
require 'mimemagic'
require 'mimemagic/overlay' # for Office 2007+ formats
require 'nokogiri'
require 'open3'
require 'pp'
require 'rack'
require 'sequel'
require 'ostruct'
require 'time'
require 'yaml'
require_relative '../util/nailgun.rb'
require_relative '../util/sanitize.rb'
require_relative '../util/xmlutil.rb'

# Max size (in bytes, I think) of a batch to send to AWS CloudSearch.
# According to the docs the absolute limit is 5 megs, so let's back off a
# little bit from that and say 4.5 megs.
MAX_BATCH_SIZE = 4500*1024

# Also, CloudSearch takes a really long time to process huge batches of
# small objects, so limit to 500 per batch.
MAX_BATCH_ITEMS = 500

# Max amount of full text we'll send with any single doc. AWS limit is 1 meg, so let's
# go a little short of that so we've got room for plenty of metadata.
MAX_TEXT_SIZE  = 950*1024

DATA_DIR = "/apps/eschol/erep/data"

# The main database we're inserting data into
DB = Sequel.connect(YAML.load_file("config/database.yaml"))
$dbMutex = Mutex.new

# Log SQL statements, to aid debugging
File.exists?('convert.sql_log') and File.delete('convert.sql_log')
DB.loggers << Logger.new('convert.sql_log')

# The old eschol queue database, from which we can get a list of indexable ARKs
QUEUE_DB = Sequel.connect(YAML.load_file("config/queueDb.yaml"))

# The old stats database, from which we can copy item counts
STATS_DB = Sequel.connect(YAML.load_file("config/statsDb.yaml"))

# Queues for thread coordination
$prefilterQueue = SizedQueue.new(100)
$indexQueue = SizedQueue.new(100)
$batchQueue = SizedQueue.new(1)  # no use getting very far ahead of CloudSearch

# Mode to force checking of the index digests (useful when indexing algorithm or unit structure changes)
$rescanMode = ARGV.delete('--rescan')

# Mode to process a single item and just print it out (no inserting or batching)
$testMode = ARGV.delete('--test')

# Mode to test against old prefilter
$prefilterMode = ARGV.delete("--prefilter")

# Mode to override up-to-date test
$forceMode = ARGV.delete('--force')
$forceMode and $rescanMode = true

# Mode to skip CloudSearch indexing and just do db updates
$noCloudSearchMode = ARGV.delete('--noCloudSearch')

# For testing only, skip items <= X, where X is like "qt26s1s6d3"
$skipTo = nil
pos = ARGV.index('--skipTo')
if pos
  ARGV.delete_at(pos)
  $skipTo = ARGV.delete_at(pos)
end

# CloudSearch API client
$csClient = Aws::CloudSearchDomain::Client.new(
  endpoint: YAML.load_file("config/cloudSearch.yaml")["docEndpoint"])

# S3 API client
$s3Config = OpenStruct.new(YAML.load_file("config/s3.yaml"))
$s3Client = Aws::S3::Client.new(region: $s3Config.region)
$s3Bucket = Aws::S3::Bucket.new($s3Config.bucket, client: $s3Client)

# Caches for speed
$allUnits = nil
$unitAncestors = nil
$issueCoverCache = {}
$issueBuyLinks = Hash[*File.readlines("/apps/eschol/erep/xtf/style/textIndexer/mapping/buyLinks.txt").map { |line|
  line =~ %r{^.*entity=(.*);volume=(.*);issue=(.*)\|(.*?)\s*$} ? ["#{$1}:#{$2}:#{$3}", $4] : [nil, line]
}.flatten]
$issueNumberingCache = {}

# Make puts thread-safe, and prepend each line with the thread it's coming from. While we're at it,
# let's auto-flush the output.
$stdoutMutex = Mutex.new
def puts(*args)
  $stdoutMutex.synchronize {
    Thread.current[:name] and STDOUT.write("[#{Thread.current[:name]}] ")
    super(*args)
    STDOUT.flush
  }
end

###################################################################################################
# Determine the old front-end server to use for thumbnailing
$hostname = `/bin/hostname`.strip
$thumbnailServer = case $hostname
  when 'pub-submit-dev'; 'http://pub-eschol-dev.escholarship.org'
  when 'pub-submit-stg-2a', 'pub-submit-stg-2c'; 'http://pub-eschol-stg.escholarship.org'
  when 'pub-submit-prd-2a', 'pub-submit-prd-2c'; 'http://escholarship.org'
  else raise("unrecognized host #{hostname}")
end

# Item counts for status updates
$nSkipped = 0
$nUnchanged = 0
$nProcessed = 0
$nTotal = 0

$scrubCount = 0

$discTbl = {"1540" => "Life Sciences",
            "3566" => "Medicine and Health Sciences",
            "3864" => "Physical Sciences and Mathematics",
            "3525" => "Engineering",
            "1965" => "Social and Behavioral Sciences",
            "1481" => "Arts and Humanities",
            "1573" => "Law",
            "3688" => "Business",
            "2932" => "Architecture",
            "3579" => "Education"}

###################################################################################################
# Monkey-patch to nicely ellide strings.
class String
  # https://gist.github.com/1168961
  # remove middle from strings exceeding max length.
  def ellipsize(options={})
    max = options[:max] || 40
    delimiter = options[:delimiter] || "..."
    return self if self.size <= max
    remainder = max - delimiter.size
    offset = remainder / 2
    (self[0,offset + (remainder.odd? ? 1 : 0)].to_s + delimiter + self[-offset,offset].to_s)[0,max].to_s
  end unless defined? ellipsize
end

###################################################################################################
# Monkey-patch to add update_or_replace functionality, which is strangely absent in the Sequel gem.
class Sequel::Model
  def self.update_or_replace(id, **data)
    record = self[id]
    if record
      record.update(**data)
    else
      data[@primary_key] = id
      Unit.create(**data)
    end
  end
end

###################################################################################################
# Model classes for easy object-relational mapping in the database

class Unit < Sequel::Model
  unrestrict_primary_key
end

class UnitHier < Sequel::Model(:unit_hier)
  unrestrict_primary_key
end

class Item < Sequel::Model
  unrestrict_primary_key
end

class UnitItem < Sequel::Model
  unrestrict_primary_key
end

class ItemAuthor < Sequel::Model
  unrestrict_primary_key
end

class ItemCount < Sequel::Model
end

class Issue < Sequel::Model
end

class Section < Sequel::Model
end

class Widget < Sequel::Model
end

class Page < Sequel::Model
end

class InfoIndex < Sequel::Model(:info_index)
end

###################################################################################################
# Insert hierarchy links (skipping dupes) for all descendants of the given unit id.
def linkUnit(id, childMap, done)
  childMap[id].each_with_index { |child, idx|
    if !done.include?([id, child])
      UnitHier.create(
        :ancestor_unit => id,
        :unit_id => child,
        :ordering => idx,
        :is_direct => true
      )
      done << [id, child]
    end
    if childMap.include?(child)
      linkUnit(child, childMap, done)
      linkDescendants(id, child, childMap, done)
    end
  }
end

###################################################################################################
# Helper function for linkUnit
def linkDescendants(id, child, childMap, done)
  childMap[child].each { |child2|
    if !done.include?([id, child2])
      #puts "linkDescendants: id=#{id} child2=#{child2}"
      UnitHier.create(
        :ancestor_unit => id,
        :unit_id => child2,
        :ordering => nil,
        :is_direct => false
      )
      done << [id, child2]
    end
    if childMap.include?(child2)
      linkDescendants(id, child2, childMap, done)
    end
  }
end

###################################################################################################
# Upload an asset file to S3 (if not already there), and return the asset ID. Attaches a hash of
# metadata to it.
def putAsset(filePath, metadata)

  # Calculate the sha256 hash, and use it to form the s3 path
  md5sum    = Digest::MD5.file(filePath).hexdigest
  sha256Sum = Digest::SHA256.file(filePath).hexdigest
  s3Path = "#{$s3Config.prefix}/binaries/#{sha256Sum[0,2]}/#{sha256Sum[2,2]}/#{sha256Sum}"

  # If the S3 file is already correct, don't re-upload it.
  obj = $s3Bucket.object(s3Path)
  if !obj.exists? || obj.etag != "\"#{md5sum}\""
    #puts "Uploading #{filePath} to S3."
    obj.put(body: File.new(filePath),
            metadata: metadata.merge({
              original_path: filePath.sub(%r{.*/([^/]+/[^/]+)$}, '\1'), # retain only last directory plus filename
              mime_type: MimeMagic.by_magic(File.open(filePath)).to_s
            }))
    obj.etag == "\"#{md5sum}\"" or raise("S3 returned md5 #{resp.etag.inspect} but we expected #{md5sum.inspect}")
  end

  return sha256Sum
end

###################################################################################################
# Upload an image to S3, and return hash of its attributes. If a block is supplied, it will receive
# the dimensions first, and have a chance to raise exceptions on them.
def putImage(imgPath, &block)
  mimeType = MimeMagic.by_magic(File.open(imgPath))
  if mimeType.subtype == "svg+xml"
    # Special handling for SVG images -- no width/height
    return { asset_id: putAsset(imgPath, {}),
             image_type: mimeType.subtype
           }
  else
    mimeType && mimeType.mediatype == "image" or raise("Non-image file #{imgPath}")
    dims = FastImage.size(imgPath)
    block and block.yield(dims)
    return { asset_id: putAsset(imgPath, { width: dims[0].to_s, height: dims[1].to_s }),
             image_type: mimeType.subtype,
             width: dims[0],
             height: dims[1]
           }
  end
end

###################################################################################################
def convertLogo(unitID, unitType, logoEl)
  # Locate the image reference
  logoImgEl = logoEl && logoEl.at("./div[@id='logoDiv']/img[@src]")
  if !logoImgEl
    if unitType != "campus"
      return {}
    end
    # Default logo for campus
    imgPath = "app/images/logo_#{unitID}.svg"
  else
    imgPath = logoImgEl && "/apps/eschol/erep/xtf/static/#{logoImgEl[:src]}"
    imgPath =~ %r{LOGO_PATH|/$} and return {} # logo never configured
  end
  if !File.file?(imgPath)
    puts "Warning: Can't find logo image: #{imgPath.inspect}"
    return {}
  end

  data = putImage(imgPath)
  (logoEl && logoEl.attr('banner') == "single") and data[:is_banner] = true
  return { logo: data }
end

###################################################################################################
def convertBlurb(unitID, blurbEl)
  # Make sure there's a div
  divEl = blurbEl && blurbEl.at("./div")
  divEl or return {}

  # Make sure the HTML conforms to our specs
  html = sanitizeHTML(divEl.inner_html)
  html.length > 0 or return {}
  return { about: html }
end

###################################################################################################
def stripXMLWhitespace(node)
  node.children.each_with_index { |kid, idx|
    if kid.comment?
      kid.remove
    elsif kid.element?
      stripXMLWhitespace(kid)
    elsif kid.text?
      prevIsElement = node.children[idx-1] && node.children[idx-1].element?
      nextIsElement = node.children[idx+1] && node.children[idx+1].element?
      ls = kid.content.lstrip
      if ls != kid.content
        if idx == 0
          if ls.empty?
            kid.remove
            next
          else
            kid.content = ls
          end
        elsif prevIsElement && nextIsElement
          kid.remove
          next
        else
          kid.content = " " + ls
        end
      end
      rs = kid.content.rstrip
      if rs != kid.content
        if idx == node.children.length - 1
          if rs.empty?
            kid.remove
            next
          else
            kid.content = rs
          end
        else
          kid.content = rs + " "
        end
      end
    end
  }
end

###################################################################################################
def convertPage(unitID, navBar, navID, contentDiv, slug, name)
  title = nil
  stripXMLWhitespace(contentDiv)
  if contentDiv.children.empty?
    puts "Warning: empty page content for page #{slug} #{name.inspect}"
    return
  end

  # If content consists of a single <p>, strip it off.
  kid = contentDiv.children[0]
  if contentDiv.children.length == 1 && kid.name =~ /^[pP]$/
    contentDiv = kid
  end

  # If it starts with a heading, grab that.
  kid = contentDiv.children[0]
  if kid.name =~ /^h1|h2|h3|H1|H2|H3$/
    title = kid.inner_html
    kid.remove
  else
    puts("Warning: no title for page #{slug} #{name.inspect}")
  end

  # If remaining content consists of a single <p>, strip it off.
  kid = contentDiv.children[0]
  if contentDiv.children.length == 1 && kid.name =~ /^[pP]$/
    contentDiv = kid
  end

  html = sanitizeHTML(contentDiv.inner_html)
  html.length > 0 or return
  attrs = { html: html }
  Page.create(unit_id: unitID,
              slug: slug,
              name: name,
              title: title ? title : name,
              attrs: JSON.generate(attrs))
  navBar << { id: navID, type: "page", slug: slug, name: name }
end

###################################################################################################
def convertNavBar(unitID, generalEl)
  # Blow away existing database pages for this unit
  Page.where(unit_id: unitID).delete

  navBar = []
  generalEl or return { nav_bar: navBar }

  # Convert each link in linkset
  linkedPagesUsed = Set.new
  aboutBar = nil
  curNavID = 0
  generalEl.xpath("./linkSet/div").each { |linkDiv|
    linkDiv.children.each { |para|
      # First, a bunch of validation checks. We're expecting this kind of thing:
      # <p><a href="http://blah">Link name</a></p>
      para.comment? and next
      if para.text?
        text = para.text.strip
        if !text.empty?
          puts "Extraneous text in linkSet: #{para}"
        end
        next
      end
      if para.name != "p"
        puts "Extraneous element in linkSet: #{para}"
        next
      end

      links = para.xpath("./a")
      if links.empty?
        puts "Missing <a> in linkSet: #{para.inner_html}"
        next
      end
      if links.length > 1
        puts "Too many <a> in linkSet: #{para.inner_html}"
        next
      end

      link = links[0]
      linkName = link.text
      linkName and linkName.strip!
      if !linkName || linkName.empty?
        puts "Missing link text: #{para.inner_html}"
        next
      end

      linkTarget = link.attr('href')
      if !linkTarget
        puts "Missing link target: #{para.inner_html}"
        next
      end

      slug = nil
      linkTarget =~ %r{/uc/search\?entity=[^;]+;view=([^;]+)$} and slug = $1

      if slug =~ /contact|contactUs|policyStatement|policies|policiesProcedures|submitPaper|submissionGuidelines/i
        addTo = navBar
      else
        if !aboutBar
          aboutBar = { id: curNavID+=1, type: "folder", name: "About", sub_nav: [] }
          navBar << aboutBar
        end
        addTo = aboutBar[:sub_nav]
      end

      if linkTarget =~ %r{/uc/search\?entity=[^;]+;view=([^;]+)$}
        slug = $1
        linkedPage = generalEl.at("./linkedPages/div[@id=#{slug}]")
        if !linkedPage
          puts "Can't find linked page #{slug.inspect}"
          next
        end
        convertPage(unitID, addTo, curNavID+=1, linkedPage, slug, linkName)
        linkedPagesUsed << slug
      elsif linkTarget =~ %r{^https?://}
        addTo << { id: curNavID+=1, type: "link", name: linkName, url: linkTarget }
      elsif linkTarget =~ %r{/brand/}
        puts "TODO: convert nav files to stub pages."
      else
        puts "Invalid link target: #{para.inner_html}"
      end
    }
  }

  # TODO: The "contactInfo" part of the brand file is supposed to end up in the "Journal Information"
  # box at the right side of the eschol UI. Database conversion TBD.
  #convertPage(unitID, navBar, generalEl.at("./contactInfo/div"), "journalInfo", BLAH)

  # Note unused linked pages
  generalEl.xpath("./linkedPages/div").each { |page|
    !linkedPagesUsed.include?(page.attr('id')) and puts "Unused linked page, id=#{page.attr('id').inspect}"
  }

  # All done.
  return { nav_bar: navBar }
end

###################################################################################################
def convertSocial(unitID, divs)
  # Hack in some social media for now
  if unitID == "ucla"
    return { twitter: "UCLA", facebook: "uclabruins" }
  elsif unitID == "uclalaw"
   return { twitter: "UCLA_Law", facebook: "pages/UCLA-School-of-Law-Official/148867995080" }
  end

  dataOut = {}
  divs.each { |div|
    next unless div.attr('id') =~ /^(contact|contactUs)$/

    # See if we can find twitter or facebook info
    div.xpath(".//a[@href]").each { |el|
      href = el.attr('href')
      if href =~ %r{^http.*twitter.com/(.*)}
        dataOut[:twitter] = $1
      elsif href =~ %r{^http.*facebook.com/(.*)}
        dataOut[:facebook] = $1
      end
    }
  }
  return dataOut
end

###################################################################################################
def defaultNav(unitID, unitType)
  if unitType == "root"
    return [
      { id: 1, type: "folder", name: "About", sub_nav: [] },
      { id: 2, type: "folder", name: "Campus Sites", sub_nav: [] },
      { id: 3, type: "folder", name: "UC Open Access", sub_nav: [] },
      { id: 4, type: "link", name: "eScholarship Publishing", url: "#" }
    ]
  elsif unitType == "campus"
    return [
      { id: 1, type: "link", name: "Open Access Policies", url: "#" },
      { id: 2, type: "link", name: "Journals", url: "/#{unitID}/journals" },
      { id: 3, type: "link", name: "Academic Units", url: "/#{unitID}/units" }
    ]
  else
    puts "Warning: no brand file found for unit #{unitID.inspect}"
    return []
  end
end

###################################################################################################
def convertUnitBrand(unitID, unitType)
  begin
    dataOut = {}

    bfPath = "/apps/eschol/erep/xtf/static/brand/#{unitID}/#{unitID}.xml"
    if File.exist?(bfPath)
      dataIn = fileToXML(bfPath).root
      dataOut.merge!(convertLogo(unitID, unitType, dataIn.at("./display/mainFrame/logo")))
      dataOut.merge!(convertBlurb(unitID, dataIn.at("./display/mainFrame/blurb")))
      if unitType == "campus"
        dataOut.merge!({ nav_bar: defaultNav(unitID, unitType) })
      else
        dataOut.merge!(convertNavBar(unitID, dataIn.at("./display/generalInfo")))
      end
      dataOut.merge!(convertSocial(unitID, dataIn.xpath("./display/generalInfo/linkedPages/div")))
    else
      dataOut.merge!({ nav_bar: defaultNav(unitID, unitType) })
    end

    return dataOut
  rescue
    puts "Error converting brand data for #{unitID.inspect}:"
    raise
  end
end

###################################################################################################
def addDefaultWidgets(unitID, unitType)
  # Blow away existing widgets for this unit
  Widget.where(unit_id: unitID).delete

  widgets = []
  # The following are from the wireframes, but we haven't implemented the widgets yet
  #case unitType
  #  when "root"
  #    widgets << { kind: "FeaturedArticles", region: "sidebar", attrs: nil }
  #    widgets << { kind: "NewJournalIssues", region: "sidebar", attrs: nil }
  #    widgets << { kind: "Tweets", region: "sidebar", attrs: nil }
  #  when "campus"
  #    widgets << { kind: "FeaturedJournals", region: "sidebar", attrs: nil }
  #    widgets << { kind: "Tweets", region: "sidebar", attrs: nil }
  #  else
  #    widgets << { kind: "FeaturedArticles", region: "sidebar", attrs: nil }
  #end
  # So for now, just put RecentArticles on everything.
  widgets << { kind: "RecentArticles", region: "sidebar", attrs: {}.to_json }

  widgets.each_with_index { |widgetInfo, idx|
    Widget.create(unit_id: unitID, ordering: idx+1, **widgetInfo)
  }
end

###################################################################################################
# Convert an allStruct element, and all its child elements, into the database.
def convertUnits(el, parentMap, childMap, allIds)
  id = el[:id] || el[:ref] || "root"
  allIds << id
  #puts "name=#{el.name} id=#{id.inspect} name=#{el[:label].inspect}"

  # Create or update the main database record
  if el.name != "ptr"
    unitType = id=="root" ? "root" : el[:type]
    # Retain CMS modifications to root and campuses
    if ['root','campus'].include?(unitType) && Unit.where(id: id).first
      puts "Preserving #{id}."
    else
      puts "Converting #{unitType} #{id}."
      name = id=="root" ? "eScholarship" : el[:label]
      Unit.update_or_replace(id,
        type:      unitType,
        name:      name,
        status:    el[:directSubmit] == "moribund" ? "archived" :
                   el[:hide] == "eschol" ? "hidden" :
                   "active"
      )

      # We can't totally fill in the brand attributes when initially inserting the record,
      # so do it as an update after inserting.
      attrs = {}
      el[:directSubmit] and attrs[:directSubmit] = el[:directSubmit]
      el[:hide]         and attrs[:hide]         = el[:hide]
      el[:issn]         and attrs[:issn]         = el[:issn]
      attrs.merge!(convertUnitBrand(id, unitType))
      nameChar = name[0].upcase
      if unitType == "journal"
        attrs[:magazine_layout] = nameChar > 'M'  # Names starting with M-Z are magazine layout (for now)
      end
      attrs[:carousel] = (nameChar >= 'F' && nameChar <= 'R')  # Names F-R have carousels (for now)
      Unit[id].update(attrs: JSON.generate(attrs))

      addDefaultWidgets(id, unitType)
    end
  end

  # Now recursively process the child units
  UnitHier.where(unit_id: id).delete
  el.children.each { |child|
    if child.name != "allStruct"
      id or raise("id-less node with children")
      childID = child[:id] || child[:ref]
      childID or raise("id-less child node")
      parentMap[childID] ||= []
      parentMap[childID] << id
      childMap[id] ||= []
      childMap[id] << childID
    end
    convertUnits(child, parentMap, childMap, allIds)
  }

  # After traversing the whole thing, it's safe to form all the hierarchy links
  if el.name == "allStruct"
    # Delete extraneous units from prior conversions
    deleteExtraUnits(allIds)

    puts "Linking units."
    linkUnit("root", childMap, Set.new)
  end
end

###################################################################################################
def arkToFile(ark, subpath, root = DATA_DIR)
  shortArk = getShortArk(ark)
  path = "#{root}/13030/pairtree_root/#{shortArk.scan(/\w\w/).join('/')}/#{shortArk}/#{subpath}"
  return path.sub(%r{^/13030}, "13030").gsub(%r{//+}, "/").gsub(/\bbase\b/, shortArk).sub(%r{/+$}, "")
end

###################################################################################################
def prefilterBatch(batch)

  # Build a file with the relative directory names of all the items to prefilter in this batch
  timestamps = {}
  nAdded = 0
  open("prefilterDirs.txt", "w") { |io|
    batch.each { |itemID, timestamp|
      shortArk = getShortArk(itemID)
      metaPath = arkToFile(shortArk, "meta/base.meta.xml")
      if !File.exists?(metaPath) || File.size(metaPath) < 50
        puts "Warning: skipping #{shortArk} due to missing or truncated meta.xml"
        $nSkipped += 1
        next
      end

      statsPath = metaPath.sub("meta.xml", "stats.xml")
      if File.exists?(statsPath) && File.size(statsPath ) < 10
        puts "Warning: skipping #{shortArk} due to truncated stats.xml"
        $nSkipped += 1
        next
      end

      io.puts arkToFile(shortArk, "", "")
      timestamps[shortArk] = timestamp
      nAdded += 1
    }
  }

  # If everything filtered out, go to next batch
  nAdded==0 and return

  # Run the XTF textIndexer in "prefilterOnly" mode. That way the stylesheets can do all the
  # dirty work of normalizing the various data formats, and we can use the uniform results.
  #puts "Running prefilter batch of #{batch.size} items."
  cmd = ["/apps/eschol/erep/xtf/bin/textIndexer",
         "-prefilterOnly",
         "-force",
         "-dirlist", "#{Dir.pwd}/prefilterDirs.txt",
         "-index", "eschol5"]
  Open3.popen2e(*cmd) { |stdin, stdoutAndErr, waitThread|
    stdin.close()

    # Process each line, looking for BEGIN prefiltered ... END prefiltered
    shortArk, buf = nil, []
    outer = []
    xmlStarted = false
    stdoutAndErr.each { |line|

      # Filter out warning messages that get interspersed
      eatNext = false
      if line =~ /(.*)Warning: Unrecognized meta-data/
        line = $1
      elsif line =~ /(.*)WARNING: LBNL subject does not map/
        line = $1
      elsif line =~ /(.*)WARNING: User supplied discipline term not found in taxonomy/
        line = $1
      end

      if line =~ /\s*<\?xml / and shortArk
        xmlStarted = true
      end

      # Look for start and end of record
      if line =~ %r{>>> BEGIN prefiltered.*/(qt\w{8})/}
        shortArk = $1
      elsif line =~ %r{>>> END prefiltered}
        # Found a full block of prefiltered data. This item is ready for indexing.
        timestamps.include?(shortArk) or
          raise("Can't find timestamp for item #{shortArk.inspect} - did we not request it?")
        $indexQueue << [shortArk, timestamps[shortArk], buf.join]
        shortArk, buf, xmlStarted = nil, [], false
      elsif shortArk
        if !xmlStarted
          #puts "Skip line before XML: #{line}"
          outer << line
        else
          buf << line
        end
      else
        outer << line
      end
    }
    waitThread.join
    if not waitThread.value.success?
      puts outer.join
      puts shortArk
      puts buf
      raise("Command failed with code #{waitThread.value.exitstatus}")
    end
    File.delete "prefilterDirs.txt"
  }
end

###################################################################################################
# Run the XTF index prefilters on every item in the queue, and pass the results on to the next
# queue (indexing).
def prefilterAllItems
  Thread.current[:name] = "prefilter thread"  # label all stdout from this thread

  # We batch up the IDs so we can prefilter a bunch at once, for efficiency.
  batch = []
  loop do
    # Grab something from the queue
    itemID, timestamp = $prefilterQueue.pop
    itemID or break

    # Add it to the batch. If we've got enough, go run the prefilters on that batch.
    batch << [itemID, timestamp]
    if batch.size >= 50
      prefilterBatch(batch)
      batch = []
    end
  end

  # Finish any remaining at the end.
  batch.empty? or prefilterBatch(batch)
  $indexQueue << [nil, nil, nil] # end-of-work
end

###################################################################################################
# Traverse the XML output from prefilters, looking for indexable text to add to the buffer.
def traverseText(node, buf)
  return if node['meta'] == "yes" || node['index'] == "no"
  node.text? and buf << node.to_s.strip
  node.children.each { |child| traverseText(child, buf) }
end

###################################################################################################
def grabText(itemID, contentType)
  buf = []
  textCoordsPath = arkToFile(itemID, "rip/base.textCoords.xml")
  htmlPath = arkToFile(itemID, "content/base.html")
  if contentType == "application/pdf" && File.file?(textCoordsPath)
    traverseText(fileToXML(textCoordsPath), buf)
  elsif contentType == "text/html" && File.file?(htmlPath)
    traverseText(fileToXML(htmlPath), buf)
  elsif contentType.nil?
    return ""
  else
    puts "Warning: no text found"
    return ""
  end
  return translateEntities(buf.join("\n"))
end

###################################################################################################
# Empty out an index batch
def emptyBatch(batch)
  batch[:items] = []
  batch[:idxData] = "["
  batch[:idxDataSize] = 0
  return batch
end

###################################################################################################
# A little class to simplify grabbing metadata from prefiltered documents.
class MetaAccess

  # Parse prefiltered data into XML, and remove the namespaces.
  def initialize(prefilteredData)
    doc = stringToXML(prefilteredData)
    doc.remove_namespaces!
    @root = doc.root
  end

  # Get the text content of a metadata field which we expect only one of
  def single(name)
    els = @root.xpath("./meta/#{name}[@meta='yes']")
    # known prob with multiple localIDs - fixed in new UCI code
    # known prob with issue IDs - old had two (one tokenized, one not)
    if els.length > 1 && name != "localID" && name != "issue"
      puts("Warning: multiple #{name.inspect} elements found.")
    end
    return els[0] ? els[0].content : nil
  end

  # Get the sanitized HTML content of a metadata field which we expect only one of
  def singleHTML(name)
    els = @root.xpath("./meta/#{name}[@meta='yes']")
    els.length <= 1 or puts("Warning: multiple #{name.inspect} elements found.")
    return els[0] ? els[0].html_at(".") : nil
  end

  # Get attribute of a single metadata field
  def singleAttr(elName, attrName, default=nil)
    els = @root.xpath("./meta/#{elName}[@meta='yes']")
    if els.length > 1 && elName != "localID"  # known prob with multiple localIDs - fixed in new UCI code
      puts("Warning: multiple #{elName.inspect} elements found.")
    end
    return els[0] ? (els[0][attrName] || default) : default
  end

  # Get an array of the content from a metadata field which we expect zero or more of.
  def multiple(name, limit=nil)
    all = @root.xpath("./meta/#{name}[@meta='yes']").map { |el| el.text }
    return limit ? all.slice(0, limit) : all
  end

  # Check if there are any metadata elements with the given name
  def any(name)
    return @root.xpath("./meta/#{name}[@meta='yes']").length > 0
  end

  # The root of the tree
  def root
    return @root
  end
end

###################################################################################################
# Given a list of units, figure out which campus(es), department(s), and journal(s) are responsible.
def traceUnits(units)
  campuses    = Set.new
  departments = Set.new
  journals    = Set.new
  series      = Set.new

  done = Set.new
  units = units.clone   # to avoid trashing the original list
  while !units.empty?
    unitID = units.shift
    if !done.include?(unitID)
      unit = $allUnits[unitID]
      if !unit
        puts "Warning: skipping unknown unit #{unitID.inspect}"
        next
      end
      if unit.type == "journal"
        journals << unitID
      elsif unit.type == "campus"
        campuses << unitID
      elsif unit.type == "oru"
        departments << unitID
      elsif unit.type =~ /series$/
        series << unitID
      end
      units += $unitAncestors[unitID]
    end
  end

  return [campuses.to_a, departments.to_a, journals.to_a, series.to_a]
end

###################################################################################################
def parseDate(str)
  text = str
  text or return nil
  begin
    if text =~ /^\d\d\d\d$/   # handle data with no month or day
      text = "#{text}-01-01"
    elsif text =~ /^\d\d\d\d-\d\d$/   # handle data with no day
      text = "#{text}-01"
    end
    ret = Date.strptime(text, "%Y-%m-%d")  # throws exception on bad date
    ret.year > 1000 && ret.year < 3000 and return ret.iso8601
  rescue
    begin
      text.sub! /-02-(29|30|31)$/, "-02-28" # Try to fix some crazy dates
      ret = Date.strptime(text, "%Y-%m-%d")  # throws exception on bad date
      ret.year > 1000 && ret.year < 3000 and return ret.iso8601
    rescue
      # pass
    end
  end

  puts "Warning: invalid date: #{str.inspect}"
  return nil
end

###################################################################################################
# Take a UCI author and make it into a string for ease of display.
def formatAuthName(auth)
  str = ""
  fname, lname = auth.text_at("./fname"), auth.text_at("./lname")
  if lname && fname
    str = "#{lname}, #{fname}"
    mname, suffix = auth.text_at("./mname"), auth.text_at("./suffix")
    mname and str += " #{mname}"
    suffix and str += ", #{suffix}"
  elsif fname
    str = fname
  elsif lname
    str = lname
  elsif auth.text_at("./email")  # special case
    str = auth.text_at("./email")
  else
    str = auth.text.strip
    str.empty? and return nil # ignore all-empty author
    puts "Warning: can't figure out author #{auth}"
  end
  return str
end

###################################################################################################
# Try to get fine-grained author info from UCIngest metadata; if not avail, fall back to index data.
def getAuthors(indexMeta, rawMeta)
  # If not UC-Ingest formatted, fall back on index info
  if !rawMeta.at("//authors") && indexMeta
    return indexMeta.multiple("creator").map { |name| {name: name} }
  end

  # For UC-Ingest, we can provide more detailed author info
  rawMeta.xpath("//authors/*").map { |el|
    if el.name == "organization"
      { name: el.text, organization: el.text }
    elsif el.name == "author"
      data = { name: formatAuthName(el) }
      el.children.each { |sub|
        text = sub.text.strip
        next if text.empty?
        data[(sub.name == "identifier") ? (sub.attr('type') + "_id").to_sym : sub.name.to_sym] = text
      }
      data && !data[:name].nil? ? data : nil
    else
      raise("Unknown element #{el.name.inspect} within UCIngest authors")
    end
  }.select{ |v| v }
end

###################################################################################################
def mimeTypeToSummaryType(mimeType)
  if mimeType
    mimeType.mediatype == "audio" and return "audio"
    mimeType.mediatype == "video" and return "video"
    mimeType.mediatype == "image" and return "images"
    mimeType.subtype == "zip" and return "zip"
  end
  return "other files"
end

###################################################################################################
def generatePdfThumbnail(itemID, existingItem)
  begin
    pdfPath = arkToFile(itemID, "content/base.pdf")
    File.exist?(pdfPath) or return nil
    pdfTimestamp = File.mtime(pdfPath).to_i
    existingThumb = existingItem ? JSON.parse(existingItem.attrs)["thumbnail"] : nil
    if existingThumb && existingThumb["timestamp"] == pdfTimestamp
      # Rebuilding to keep order of fields consistent
      return { asset_id:   existingThumb["asset_id"],
               image_type: existingThumb["image_type"],
               width:      existingThumb["width"].to_i,
               height:     existingThumb["height"].to_i,
               timestamp:  existingThumb["timestamp"].to_i
              }
    end

    url = "#{$thumbnailServer}/uc/item/#{itemID.sub(/^qt/, '')}?image.view=generateImage;imgWidth=121;pageNum=1"
    response = HTTParty.get(url)
    response.code.to_i == 200 or raise("Error generating thumbnail: HTTP #{response.code}: #{response.message}")
    tempFile = Tempfile.new("thumbnail")
    begin
      tempFile.write(response.body)
      tempFile.close
      data = putImage(tempFile.path) { |dims|
        dims[0] == 121 or raise("Got thumbnail width #{dims[0]}, wanted 121")
        dims[1] < 300 or raise("Got thumbnail height #{dims[1]}, wanted less than 300")
      }
      data[:timestamp] = pdfTimestamp
      return data
    ensure
      begin
        tempFile.close
      rescue Exception => e
        # ignore
      end
      tempFile.unlink
    end
  rescue Exception => e
    puts "Warning: error generating thumbnail: #{e}: #{e.backtrace.join("; ")}"
  end
end

###################################################################################################
# See if we can find a cover image for the given issue. If so, add it to dbAttrs.
def findIssueCover(unit, volume, issue, caption, dbAttrs)
  key = "#{unit}:#{volume}:#{issue}"
  if !$issueCoverCache.key?(key)
    # Check the special directory for a cover image.
    imgPath = "/apps/eschol/erep/xtf/static/issueCovers/#{unit}/#{volume.rjust(2,'0')}_#{issue.rjust(2,'0')}_cover.png"
    data = nil
    if File.exist?(imgPath)
      data = putImage(imgPath)
      caption and data[:caption] = sanitizeHTML(caption)
    end
    $issueCoverCache[key] = data
  end

  $issueCoverCache[key] and dbAttrs['cover'] = $issueCoverCache[key]
end

###################################################################################################
# See if we can find a buy link for this issue, from the table Lisa made.
def addIssueBuyLink(unit, volume, issue, dbAttrs)
  key = "#{unit}:#{volume}:#{issue}"
  link = $issueBuyLinks[key]
  link and dbAttrs[:buy_link] = link
end

###################################################################################################
def addIssueNumberingAttrs(issueUnit, volNum, issueNum, issueAttrs)
  data = $issueNumberingCache[issueUnit]
  if !data
    data = {}
    bfPath = "/apps/eschol/erep/xtf/static/brand/#{issueUnit}/#{issueUnit}.xml"
    if File.exist?(bfPath)
      dataIn = fileToXML(bfPath).root
      el = dataIn.at(".//singleIssue")
      if el && el.text == "yes"
        data[:singleIssue] = true
        data[:startVolume] = dataIn.at("./singleIssue").attr("startVolume")
      end
      el = dataIn.at(".//singleVolume")
      if el && el.text == "yes"
        data[:singleVolume] = true
      end
    end
    $issueNumberingCache[issueUnit] = data
  end

  if data[:singleIssue]
    if data[:startVolume].nil? or volNum.to_i >= data[:startVolume].to_i
      issueAttrs[:numbering] = "volume_only"
    end
  elsif data[:singleVolume]
    issueAttrs[:numbering] = "issue_only"
  end

end

###################################################################################################
def grabUCISupps(rawMeta)
  # For UCIngest format, read supp data from the raw metadata file.
  supps = []
  rawMeta.xpath("//content/supplemental/file").each { |fileEl|
    suppAttrs = { file: fileEl[:path].sub(%r{.*content/supp/}, "") }
    fileEl.children.each { |subEl|
      next if subEl.name == "mimeType" && subEl.text == "unknown"
      suppAttrs[subEl.name] = subEl.text
    }
    supps << suppAttrs
  }
  return supps
end

###################################################################################################
def summarizeSupps(itemID, inSupps)
  outSupps = nil
  suppSummaryTypes = Set.new
  inSupps.each { |supp|
    suppPath = arkToFile(itemID, "content/supp/#{supp[:file]}")
    if !File.exist?(suppPath)
      puts "Warning: can't find supp file #{supp[:file]}"
    else
      # Mime types aren't always reliable coming from Subi. Let's try harder.
      mimeType = MimeMagic.by_magic(File.open(suppPath))
      if mimeType && mimeType.type
        supp.delete("mimeType")  # in case old string-based mimeType is present
        supp[:mimeType] = mimeType.to_s
      end
      suppSummaryTypes << mimeTypeToSummaryType(mimeType)
      (outSupps ||= []) << supp
    end
  }
  return outSupps, suppSummaryTypes
end

###################################################################################################
def translateRights(oldRights)
  case oldRights
    when "cc1"; "CC BY"
    when "cc2"; "CC BY-SA"
    when "cc3"; "CC BY-ND"
    when "cc4"; "CC BY-NC"
    when "cc5"; "CC BY-NC-SA"
    when "cc6"; "CC BY-NC-ND"
    when nil, "public"; nil
    else puts "Unknown rights value #{pf.single("rights").inspect}"
  end
end

###################################################################################################
def isEmbargoed(embargoDate)
  return embargoDate && Date.today < Date.parse(parseDate(embargoDate))
end

###################################################################################################
# Extract metadata the old way, combining data from the XTF index prefilters and the raw UCIngest
# metadata files.
def parsePrefilteredData(itemID, existingItem, rawMeta, prefilteredData)

  # Add in the namespace declaration to the individual article (since we're taking the articles
  # out of their outer context)
  prefilteredData.sub! "<erep-article>", "<erep-article xmlns:xtf=\"http://cdlib.org/xtf\">"

  # Parse the metadata
  pf = MetaAccess.new(prefilteredData)
  if pf.root.nil?
    raise("Error parsing prefiltered data as XML. First part: " +
      (prefilteredData.size > 500 ? prefilteredData[0,500]+"..." : prefilteredData).inspect)
  end

  # Grab the stuff we're jamming into the JSON 'attrs' field
  attrs = {}
  pf.multiple("contentExists")[0] == "yes" or attrs[:suppress_content] = true  # yes, inverting the sense
  pf.single("peerReview"   ) == "yes" and attrs[:is_peer_reviewed] = true
  pf.single("undergrad "   ) == "yes" and attrs[:is_undergrad] = true
  pf.single("language"     )          and attrs[:language] = pf.single("language").sub("english", "en")
  pf.single("embargoed")              and attrs[:embargo_date] = pf.single("embargoed")
  pf.single("publisher")              and attrs[:publisher] = pf.single("publisher")
  pf.single("originalCitation")       and attrs[:orig_citation] = pf.single("originalCitation")
  pf.single("customCitation")         and attrs[:custom_citation] = pf.single("customCitation")
  pf.single("localID")                and attrs[:local_id] = { type: pf.singleAttr("localID", :type, "other"),
                                                                 id: pf.single("localID") }
  pf.multiple("publishedWebLocation") and attrs[:pub_web_loc] = pf.multiple("publishedWebLocation")
  pf.single("buyLink")                and attrs[:buy_link] = pf.single("buyLink")
  pf.single("doi")                    and attrs[:doi] = pf.single("doi")
  if pf.single("withdrawn")
    attrs[:withdrawn_date] = pf.single("withdrawn")
    msg = rawMeta.at("/record/history/stateChange[@state='withdrawn']/comment")
    msg and attrs[:withdrawn_message] = msg.text
  end

  # Filter out "n/a" abstracts
  abstract = pf.singleHTML("description")
  abstract && abstract.size > 3 and attrs[:abstract] = abstract

  # Disciplines are a little extra work; we want to transform numeric IDs to plain old labels
  if pf.any("facet-discipline")
    attrs[:disciplines] = []
    pf.multiple("facet-discipline").each { |discStr|
      discID = discStr[/^\d+/] # only the numeric part
      label = $discTbl[discID]
      if label
        attrs[:disciplines] << label
      else
        puts("Warning: unknown discipline ID #{discID.inspect}")
        puts "pf: discStr=#{discStr}"
        puts "pf: discTbl=#{$discTbl}" # FIXME FOO
      end
    }
  end

  # Supplemental files
  supps = []
  if rawMeta.at("/record/content")
    supps = grabUCISupps(rawMeta)
  else
    # For non-UCIngest format, read supp data from the index
    pf.multiple("supplemental-file").each { |supp|
      pair = supp.split("::")
      if pair.length != 2
        puts "Warning: can't parse supp file data #{supp.inspect}"
        next
      end
      supps << { file: pair[1], "description" => pair[0] }
    }
  end
  attrs[:supp_files], suppSummaryTypes = summarizeSupps(itemID, supps)

  # Do some translation on rights codes
  rights = translateRights(pf.single("rights"))

  # For eschol journals, populate the issue and section models.
  issue = section = nil
  issueNum = pf.single("issue[@tokenize='no']") # untokenized is actually from "number"
  volNum = pf.single("volume")
  if pf.single("pubType") == "journal" && volNum && issueNum
    issueUnit = pf.multiple("entityOnly")[0]
    if $allUnits.include?(issueUnit)
      issue = Issue.new
      issue[:unit_id] = issueUnit
      issue[:volume]  = volNum
      issue[:issue]   = issueNum
      tmp = rawMeta.at("/record/context/issueDate")
      issue[:pub_date] = (tmp && tmp.text && !tmp.text.empty? && parseDate(tmp.text)) ||
                         parseDate(pf.single("date")) ||
                         "1901-01-01"
      issueAttrs = {}
      tmp = rawMeta.at("/record/context/issueTitle")
      (tmp && tmp.text && !tmp.text.empty?) and issueAttrs[:title] = tmp.text
      tmp = rawMeta.at("/record/context/issueDescription")
      (tmp && tmp.text && !tmp.text.empty?) and issueAttrs[:description] = tmp.text
      tmp = rawMeta.at("/record/context/issueCoverCaption")
      findIssueCover(issueUnit, volNum, issueNum,
                     (tmp && tmp.text && !tmp.text.empty?) ? tmp : nil,
                     issueAttrs)
      addIssueBuyLink(issueUnit, volNum, issueNum, issueAttrs)
      addIssueNumberingAttrs(issueUnit, volNum, issueNum, issueAttrs)
      rights and issueAttrs[:rights] = rights
      !issueAttrs.empty? and issue[:attrs] = issueAttrs.to_json

      section = Section.new
      section[:name]  = pf.single("sectionHeader") ? pf.single("sectionHeader") : "Articles"
    else
      "Warning: issue associated with unknown unit #{issueUnit.inspect}"
    end
  end

  # Data for external journals
  if !issue
    issueNum = pf.single("issue") # tokenization not an issue for external journal articles
    pf.single("journal") and (attrs[:ext_journal] ||= {})[:name]   = pf.single("journal")
    volNum               and (attrs[:ext_journal] ||= {})[:volume] = volNum
    issueNum             and (attrs[:ext_journal] ||= {})[:issue]  = issueNum
    pf.single("issn")    and (attrs[:ext_journal] ||= {})[:issn]   = pf.single("issn")
    if pf.single("coverage") =~ /^([\w.]+) - ([\w.]+)$/
      (attrs[:ext_journal] ||= {})[:fpage] = $1
      (attrs[:ext_journal] ||= {})[:lpage] = $2
    end
  end

  # Detect HTML-formatted items
  contentFile = rawMeta.at("/record/content/file")
  contentFile && contentFile.at("./native") and contentFile = contentFile.at("./native")
  contentPath = contentFile && contentFile[:path]
  mimeType    = contentFile && contentFile.at("./mimeType") && contentFile.at("./mimeType").text

  # Generate thumbnails (but only for non-suppressed PDF items)
  if !attrs[:suppress_content] && pf.single("pdfExists") == "yes"
    thumbData = generatePdfThumbnail(itemID, existingItem)
    thumbData and attrs[:thumbnail] = thumbData
  end

  # Populate the Item model instance
  dbItem = Item.new
  dbItem[:id]           = itemID
  dbItem[:source]       = pf.single("source")
  dbItem[:status]       = attrs[:withdrawn_date] ? "withdrawn" :
                          isEmbargoed(attrs[:embargo_date]) ? "embargoed" :
                          (rawMeta.attr("state") || "published")
  dbItem[:title]        = pf.single("title")
  dbItem[:content_type] = !(pf.multiple("contentExists")[0] == "yes") ? nil :
                          attrs[:withdrawn_date] ? nil :
                          isEmbargoed(attrs[:embargo_date]) ? nil :
                          pf.single("pdfExists") == "yes" ? "application/pdf" :
                          mimeType && mimeType.strip.length > 0 ? mimeType :
                          nil
  dbItem[:genre]        = (!attrs[:suppress_content] &&
                           dbItem[:content_type].nil? &&
                           attrs[:supp_files]) ?
                          "multimedia" : pf.single("type")
  dbItem[:pub_date]     = parseDate(pf.single("date")) || "1901-01-01"
  #FIXME: Think about this carefully. What's eschol_date for?
  dbItem[:eschol_date]  = parseDate(pf.single("dateStamp")) || "1901-01-01"
  dbItem[:attrs]        = JSON.generate(attrs)
  dbItem[:rights]       = rights
  dbItem[:ordering_in_sect] = pf.single("document-order")

  # Populate ItemAuthor model instances
  authors = getAuthors(pf, rawMeta)

  # Make a list of all the units this item belongs to
  units = pf.multiple("entityOnly").select { |unitID|
    unitID =~ /^(postprints|demo-journal|test-journal|unknown|withdrawn|uciem_westjem_aip)$/ ? false :
      !$allUnits.include?(unitID) ? (puts("Warning: unknown unit #{unitID.inspect}") && false) :
      true
  }

  # It's actually ok for there to be no units, e.g. for old withdrawn items
  if units.empty?
    #do nothing
  end

  return dbItem, attrs, authors, units, issue, section, suppSummaryTypes
end

###################################################################################################
def shouldSuppressContent(itemID, inMeta)
  # Suppress if withdrawn.
  inMeta.attr("state") == "withdrawn" and return true

  # Supresss if we can't find any of: PDF file, HTML file, supp file, publishedWebLocation.
  inMeta.at("./content/file[@path]") and return false
  inMeta.at("./content/supplemental/file[@path]") and return false
  inMeta.text_at("./context/publishedWebLocation") and return false
  if File.exist?(arkToFile(itemID, "content/base.pdf"))
    #puts "Warning: PDF content file without corresponding content/file metadata"
    return false
  end

  puts "Warning: content-free item"
  return true
end

###################################################################################################
def parseDataAvail(inMeta, attrs)
  el = inMeta.at("./content/supplemental/dataStatement")
  el or return
  ds = { type: el[:type] }
  if el.text && !el.text.strip.empty?
    if el[:type] == "publicRepo"
      ds[:url] = el.text.strip
    elsif el[:type] == "notAvail"
      ds[:reason] = el.text.strip
    elsif el[:type] == "thirdParty"
      ds[:contact] = el.text.strip
    end
  end
  attrs[:data_avail_stmnt] = ds
end

###################################################################################################
def parseUCIngest(itemID, inMeta, fileType)
  attrs = {}
  attrs[:suppress_content] = shouldSuppressContent(itemID, inMeta)
  attrs[:is_peer_reviewed] = inMeta[:peerReview] == "yes"
  attrs[:is_undergrad] = inMeta[:undergrad] == "yes"
  attrs[:embargo_date] = inMeta[:embargoDate]
  attrs[:publisher] = inMeta.text_at("./publisher")
  attrs[:orig_citation] = inMeta.text_at("./originalCitation")
  attrs[:custom_citation] = inMeta.text_at("./customCitation")
  attrs[:local_ids] = inMeta.xpath("./context/localID").map { |el| { type: el[:type], id: el.text } }
  attrs[:pub_web_loc] = inMeta.xpath("./context/publishedWebLocation").map { |el| el.text.strip }
  attrs[:buy_link] = inMeta.text_at("./context/buyLink")
  attrs[:language] = inMeta.text_at("./context/language")
  attrs[:doi] = inMeta.text_at("./doi")

  # Normalize language codes
  attrs[:language] and attrs[:language] = attrs[:language].sub("english", "en").sub("german", "de").
                                                           sub("french", "fr").sub("spanish", "es")

  # Set disableDownload flag based on content file
  tmp = inMeta.at("./context/file[@disableDownload]")
  tmp and attrs[:disable_download] = tmp[:disableDownload]

  if inMeta[:state] == "withdrawn"
    tmp = inMeta.at("./history/stateChange[@state='withdrawn']")
    tmp and attrs[:withdrawn_date] = tmp[:date].sub(/T.+$/, "")
    if !attrs[:withdrawn_date]
      puts "Warning: no withdraw date found; using stateDate."
      attrs[:withdrawn_date] = inMeta[:stateDate]
    end
    msg = inMeta.text_at("./history/stateChange[@state='withdrawn']/comment")
    msg and attrs[:withdrawn_message] = msg
  end

  # Filter out "n/a" abstracts
  abstract = inMeta.html_at("./abstract")
  abstract and abstract = sanitizeHTML(abstract)
  abstract && abstract.size > 3 and attrs[:abstract] = abstract

  # Disciplines are a little extra work; we want to transform numeric IDs to plain old labels
  attrs[:disciplines] = inMeta.xpath("./disciplines/discipline").map { |discEl|
    discID = discEl[:id]
    if discID == "" && discEl.text && discEl.text.strip && $discTbl.values.include?(discEl.text.strip)
      # Kludge for old <disciplines> with no ID but with exact text
      label = discEl.text.strip
    else
      discID and discID.sub!(/^disc/, "")
      label = $discTbl[discID]
    end
    if !label
      puts("Warning: unknown discipline ID #{discID.inspect}")
      puts "uci: discEl=#{discEl}"
      puts "uci: discTbl=#{$discTbl}" # FIXME FOO
    end
    label
  }.select { |v| v }

  # Supplemental files
  attrs[:supp_files], suppSummaryTypes = summarizeSupps(itemID, grabUCISupps(inMeta))

  # Data availability statement
  parseDataAvail(inMeta, attrs)

  # We'll need this in a couple places later on
  rights = translateRights(inMeta.text_at("./rights"))

  # For eschol journals, populate the issue and section models.
  issue = section = nil
  volNum = inMeta.text_at("./context/volume")
  issueNum = inMeta.text_at("./context/issue")
  if issueNum
    issueUnit = inMeta.xpath("./context/entity[@id]").select {
                      |ent| $allUnits[ent[:id]] && $allUnits[ent[:id]].type == "journal" }[0]
    issueUnit and issueUnit = issueUnit[:id]
    if issueUnit
      # Data for eScholarship journals
      if $allUnits.include?(issueUnit)
        volNum.nil? and raise("missing volume number on eschol journal item")

        issue = Issue.new
        issue[:unit_id]  = issueUnit
        issue[:volume]   = volNum
        issue[:issue]    = issueNum
        if inMeta.text_at("./context/issueDate") == "0"  # hack for westjem AIP
          issue[:pub_date] = parseDate(inMeta.text_at("./history/originalPublicationDate") ||
                                       inMeta.text_at("./history/escholPublicationDate") ||
                                       inMeta[:dateStamp])
        else
          issue[:pub_date] = parseDate(inMeta.text_at("./context/issueDate") ||
                                       inMeta.text_at("./history/originalPublicationDate") ||
                                       inMeta.text_at("./history/escholPublicationDate") ||
                                       inMeta[:dateStamp])
        end
        issueAttrs = {}
        tmp = inMeta.text_at("/record/context/issueTitle")
        tmp and issueAttrs[:title] = tmp
        tmp = inMeta.text_at("/record/context/issueDescription")
        tmp and issueAttrs[:description] = tmp
        tmp = inMeta.text_at("/record/context/issueCoverCaption")
        findIssueCover(issueUnit, volNum, issueNum, tmp, issueAttrs)
        addIssueBuyLink(issueUnit, volNum, issueNum, issueAttrs)
        addIssueNumberingAttrs(issueUnit, volNum, issueNum, issueAttrs)
        rights and issueAttrs[:rights] = rights
        !issueAttrs.empty? and issue[:attrs] = issueAttrs.to_json

        section = Section.new
        section[:name] = inMeta.text_at("./context/sectionHeader") || "Articles"
      else
        "Warning: issue associated with unknown unit #{issueUnit.inspect}"
      end
    else
      # Data for external journals
      exAtts = {}
      exAtts[:name] = inMeta.text_at("./context/journal")
      exAtts[:volume] = inMeta.text_at("./context/volume")
      exAtts[:issue] = inMeta.text_at("./context/issue")
      exAtts[:issn] = inMeta.text_at("./context/issn")
      exAtts[:fpage] = inMeta.text_at("./extent/fpage")
      exAtts[:lpage] = inMeta.text_at("./extent/lpage")
      exAtts.reject! { |k, v| !v }
      exAtts.empty? or attrs[:ext_journal] = exAtts
    end
  end

  # Generate thumbnails (but only for non-suppressed PDF items)
  if !attrs[:suppress_content] && File.exist?(arkToFile(itemID, "content/base.pdf"))
    attrs[:thumbnail] = generatePdfThumbnail(itemID, Item[itemID])
  end

  # Remove empty attrs
  attrs.reject! { |k, v| !v || (v.respond_to?(:empty?) && v.empty?) }

  # Detect HTML-formatted items
  contentFile = inMeta.at("/record/content/file")
  contentFile && contentFile.at("./native") and contentFile = contentFile.at("./native")
  contentPath = contentFile && contentFile[:path]
  contentType = contentFile && contentFile.at("./mimeType") && contentFile.at("./mimeType").text

  # Populate the Item model instance
  dbItem = Item.new
  dbItem[:id]           = itemID
  dbItem[:source]       = inMeta.text_at("./source") or raise("no source found")
  dbItem[:status]       = attrs[:withdrawn_date] ? "withdrawn" :
                          isEmbargoed(attrs[:embargo_date]) ? "embargoed" :
                          (inMeta[:state] || raise("no state in record"))
  dbItem[:title]        = sanitizeHTML(inMeta.html_at("./title"))
  dbItem[:content_type] = attrs[:suppress_content] ? nil :
                          attrs[:withdrawn_date] ? nil :
                          isEmbargoed(attrs[:embargo_date]) ? nil :
                          File.file?(arkToFile(itemID, "content/base.pdf")) ? "application/pdf" :
                          contentType && contentType.strip.length > 0 ? contentType :
                          nil
  dbItem[:genre]        = (!attrs[:suppress_content] &&
                           dbItem[:content_type].nil? &&
                           attrs[:supp_files]) ? "multimedia" :
                          fileType == "ETD" ? "dissertation" :
                          inMeta[:type] ? inMeta[:type].sub("paper", "article") :
                          "article"
  dbItem[:eschol_date]  = parseDate(inMeta.text_at("./history/escholPublicationDate")) ||
                          parseDate(inMeta[:dateStamp])
  dbItem[:pub_date]     = parseDate(inMeta.text_at("./history/originalPublicationDate")) ||
                          dbItem[:eschol_date]
  dbItem[:attrs]        = JSON.generate(attrs)
  dbItem[:rights]       = rights
  dbItem[:ordering_in_sect] = inMeta.text_at("./context/publicationOrder")

  # Populate ItemAuthor model instances
  authors = getAuthors(nil, inMeta)

  # Make a list of all the units this item belongs to
  units = inMeta.xpath("./context/entity[@id]").map { |ent| ent[:id] }.select { |unitID|
    unitID =~ /^(postprints|demo-journal|test-journal|unknown|withdrawn|uciem_westjem_aip)$/ ? false :
      !$allUnits.include?(unitID) ? (puts("Warning: unknown unit #{unitID.inspect}") && false) :
      true
  }

  return dbItem, attrs, authors, units, issue, section, suppSummaryTypes
end

###################################################################################################
def processWithNormalizer(fileType, itemID, metaPath, nailgun)
  begin
    normalizer = case fileType
      when "ETD"
        "/apps/eschol/erep/xtf/normalization/etd/normalize_etd.xsl"
      when "BioMed"
        "/apps/eschol/erep/xtf/normalization/biomed/normalize_biomed.xsl"
      when "Springer"
        "/apps/eschol/erep/xtf/normalization/springer/normalize_springer.xsl"
      else
        raise("Unknown normalization type")
    end

    # Run the raw (ProQuest or METS) data through a normalization stylesheet using Saxon via nailgun
    normText = nailgun.call("net.sf.saxon.Transform",
      ["-r", "org.apache.xml.resolver.tools.CatalogResolver",
       "-x", "org.apache.xml.resolver.tools.ResolvingXMLReader",
       "-y", "org.apache.xml.resolver.tools.ResolvingXMLReader",
       metaPath, normalizer])

    # Write it out to a file locally (useful for debugging and validation)
    FileUtils.mkdir_p(arkToFile(itemID, "", "normalized")) # store in local dir
    normFile = arkToFile(itemID, "base.norm.xml", "normalized")
    normXML = stringToXML(normText)
    File.open(normFile, "w") { |io| normXML.write_xml_to(io, indent:3) }

    # Validate using jing.
    schemaPath = "/apps/eschol/erep/xtf/schema/uci_schema.rnc"
    validationProbs = nailgun.call("com.thaiopensource.relaxng.util.Driver", ["-c", schemaPath, normFile], true)
    if !validationProbs.empty?
      validationProbs.split("\n").each { |line|
        next if line =~ /missing required element "(subject|mimeType)"/ # we don't care
        puts line.sub(/.*norm.xml:/, "")
      }
    end

    # And parse the data
    return parseUCIngest(itemID, normXML.root, fileType)
  rescue Exception => e
    puts "Error processing normalized data: #{e} at #{e.backtrace.join("; ")}"
  end
end

###################################################################################################
def compareAttrs(oldAttrs, newAttrs)
  if newAttrs.nil?
    puts "normDiff: newAttrs is nil"
    return
  end
  if oldAttrs[:local_id]
    oldAttrs[:local_ids] = [oldAttrs[:local_id]]
    oldAttrs.delete(:local_id)
  end

  (oldAttrs.keys & newAttrs.keys).each { |key|
    oldVal, newVal = oldAttrs[key], newAttrs[key]
    next if oldVal == newVal
    next if key == :local_ids # known differences, and unused by current front-end anyway
    next if oldVal.instance_of?(String) && newVal.instance_of?(String) &&
            oldVal.gsub(/\s\s+/, ' ') == newVal.gsub(/\s\s+/, ' ')  # space normalization better now
    next if oldVal.instance_of?(String) && newVal.instance_of?(String) &&
            sanitizeHTML(oldVal) == sanitizeHTML(newVal)   # new normalization is better
    next if oldVal.instance_of?(Date) && newVal.instance_of?(Date) &&
            oldVal.year == 1901    # we work harder now for dates
    next if oldVal.instance_of?(String) && newVal.instance_of?(String) &&
            oldVal.gsub(/\s/, "") == newVal.gsub(%r{</?[^>]+>}, "").gsub(/\s/, "")
    next if oldVal.instance_of?(Date) && newVal.instance_of?(Date) &&
            oldAttrs[:withdrawn_date]    # doesn't matter for withdrawn items
    next if oldVal.instance_of?(String) && newVal.instance_of?(String) &&
            oldVal.gsub(%r{"\s+|\s+"}, '"') == newVal
    next if key == :content_type && oldVal.nil?   # better detection of PDFs now
    next if key == :eschol_date   # old logic was sucky
    next if oldVal.inspect.gsub(%r{\"\w+\"=>\"\",?\s}, "") == newVal.inspect   # better removal of unused
    next if key == :ext_journal && oldVal.inspect == newVal.inspect.gsub(%r{, :fpage=>\"[^"]+\"}, "")  # new fpage logic better
    next if key == :genre && oldVal == "article" && newVal == "chapter"
    puts "normDiff: old[:#{key}]=#{oldVal.inspect.ellipsize(max:200)}"
    puts "       vs new[:#{key}]=#{newVal.inspect.ellipsize(max:200)}"
  }
  (oldAttrs.keys - newAttrs.keys).each { |key|
    oldVal = oldAttrs[key]
    next if !oldVal
    next if oldVal.respond_to?(:empty?) && oldVal.empty?
    next if oldVal == "en"  # old language processing for UCI files was kludged to always be english
    next if key == :ext_journal && (!oldVal[:issue] || oldVal[:volume])   # silly to have journal without vol/iss
    next if key == :suppress_content && oldAttrs[:embargo_date] && newAttrs[:embargo_date] # old was incorrectly suppressing
    next if oldVal.respond_to?(:strip) && oldVal.strip.empty?  # new stripping logic is better
    next if key == :abstract && oldVal =~ %r{n/a|<html/>}i  # new n/a logic is better
    next if key == :suppress_content && oldAttrs[:content_type].nil?  # better PDF detection now
    puts "normDiff: removed old[:#{key}]=#{oldVal.inspect.ellipsize}"
  }
  (newAttrs.keys - oldAttrs.keys).each { |key|
    newVal = newAttrs[key]
    next if key == :embargo_date # old converter omits if item no longer embargoed
    next if key == :local_ids # known differences, and unused by current front-end anyway
    next if key == :disciplines # new code is better at identifying these
    puts "normDiff: added new[:#{key}]=#{newVal.inspect.ellipsize}"
  }
end

###################################################################################################
def compareAuthors(oldAuthors, newAuthors)
  (0..[oldAuthors.length-1, newAuthors.length-1].max).each { |idx|
    oldAuth, newAuth = oldAuthors[idx], newAuthors[idx]
    if oldAuth != newAuth
      next if !oldAuth.nil? && !newAuth.nil? &&
              !oldAuth[:name].nil? && !newAuth[:name].nil? &&
              oldAuth[:name] == newAuth[:name]  # ignore lname, mname, etc.
      puts "normDiff: author #{idx+1} changed: old=#{oldAuth.inspect.ellipsize(max: 200)}"
      puts "                            new=#{newAuth.inspect.ellipsize(max: 200)}"
    end
  }
end

###################################################################################################
def compareUnits(oldUnits, newUnits)
  if oldUnits.uniq != newUnits
    puts "normDiff: units changed: old=#{oldUnits.uniq.inspect}"
    puts "                         new=#{newUnits.inspect}"
  end
end

###################################################################################################
def compareIssues(oldIss, newIss, oldSect, newSect)
  if oldIss.inspect.gsub(/\s\s+/, " ") != newIss.inspect.gsub(/\s\s+/, " ")
    puts "normDiff: issue changed. old=#{oldIss.inspect.ellipsize(max:200)}"
    puts "                         new=#{newIss.inspect.ellipsize(max:200)}"
  end
  if oldSect.inspect.ellipsize(max:200) != newSect.inspect.ellipsize(max:200)
    return if oldSect.inspect.gsub(%r{"\s+|\s+"}, '"') == newSect.inspect  # new space norm better
    puts "normDiff: section changed. old=#{oldSect.inspect.ellipsize(max:200)}"
    puts "                           new=#{newSect.inspect.ellipsize(max:200)}"
  end
end

###################################################################################################
def compareSuppSummaries(oldSumm, newSumm)
  if oldSumm.inspect != newSumm.inspect
    puts "normDiff: supp summary changed. old=#{oldSumm.inspect.ellipsize(max:200)}"
    puts "                                new=#{newSumm.inspect.ellipsize(max:200)}"
  end
end

###################################################################################################
def addIdxUnits(idxItem, units)
  campuses, departments, journals, series = traceUnits(units)
  campuses.empty?    or idxItem[:fields][:campuses] = campuses
  departments.empty? or idxItem[:fields][:departments] = departments
  journals.empty?    or idxItem[:fields][:journals] = journals
  series.empty?      or idxItem[:fields][:series] = series
end

###################################################################################################
# Extract metadata for an item, and add it to the current index batch.
# Note that we create, but don't yet add, records to our database. We put off really inserting
# into the database until the batch has been successfully processed by AWS.
def indexItem(itemID, timestamp, prefilteredData, batch, nailgun)

  # Grab the main metadata file
  metaPath = arkToFile(itemID, "meta/base.meta.xml")
  if !File.exists?(metaPath) || File.size(metaPath) < 50
    puts "Warning: skipping #{itemID} due to missing or truncated meta.xml"
    $nSkipped += 1
    return
  end
  rawMeta = fileToXML(metaPath)
  rawMeta.remove_namespaces!
  rawMeta = rawMeta.root

  existingItem = Item[itemID]

  normalize = nil
  if rawMeta.name =~ /^DISS_submission/ ||
     (rawMeta.name == "mets" && rawMeta.attr("PROFILE") == "http://www.loc.gov/mets/profiles/00000026.html")
    normalize = "ETD"
  elsif rawMeta.name == "mets"
    normalize = "BioMed"
  elsif rawMeta.name == "Publisher"
    normalize = "Springer"
  end

  Thread.current[:name] = "index thread: #{itemID} #{sprintf("%-8s", normalize ? normalize : "UCIngest")}"

  if normalize
    dbItem, attrs, authors, units, issue, section, suppSummaryTypes =
      processWithNormalizer(normalize, itemID, metaPath, nailgun)
  else
    dbItem, attrs, authors, units, issue, section, suppSummaryTypes =
      parseUCIngest(itemID, rawMeta, "UCIngest")
  end

  # Optional: test against old XTF index prefilters
  if prefilteredData
    pf_dbItem, pf_attrs, pf_authors, pf_units, pf_issue, pf_section, pf_suppSummaryTypes =
       parsePrefilteredData(itemID, existingItem, rawMeta, prefilteredData)
    begin
      compareAttrs(attrs, new_attrs)
      compareAttrs(dbItem.to_hash.reject { |k,v| k == :attrs },
                   new_dbItem.to_hash.reject { |k,v| k == :attrs })
      compareAuthors(authors, new_authors)
      compareUnits(units, new_units)
      compareIssues(issue, new_issue, section, new_section)
      compareSuppSummaries(suppSummaryTypes, new_suppSummaryTypes)
    rescue Exception => e
      puts "Error comparing: #{e} #{e.backtrace.join("; ")}"
    end
  end

  text = grabText(itemID, dbItem.content_type)

  # Create JSON for the full text index
  idxItem = {
    type:          "add",   # in CloudSearch land this means "add or update"
    id:            itemID,
    fields: {
      title:         dbItem[:title] || "",
      authors:       (authors.length > 1000 ? authors[0,1000] : authors).map { |auth| auth[:name] },
      abstract:      attrs[:abstract] || "",
      type_of_work:  dbItem[:genre],
      disciplines:   attrs[:disciplines] ? attrs[:disciplines] : [""], # only the numeric parts
      peer_reviewed: attrs[:is_peer_reviewed] ? 1 : 0,
      pub_date:      dbItem[:pub_date].to_date.iso8601 + "T00:00:00Z",
      pub_year:      dbItem[:pub_date].year,
      rights:        dbItem[:rights] || "",
      sort_author:   (authors[0] || {name:""})[:name].gsub(/[^\w ]/, '').downcase,
      is_info:       0
    }
  }

  # Determine campus(es), department(s), and journal(s) by tracing the unit connnections.
  addIdxUnits(idxItem, units)

  # Summary of supplemental file types
  suppSummaryTypes.empty? or idxItem[:fields][:supp_file_types] = suppSummaryTypes.to_a

  # Limit text based on size of other fields (so, 1000 authors will mean less text).
  # We have to stay under the overall limit for a CloudSearch record. This problem is
  # a little tricky, since conversion to JSON introduces additional characters, and
  # it's hard to predict how many. So we just use a binary search.
  idxItem[:fields][:text] = text
  if JSON.generate(idxItem).bytesize > MAX_TEXT_SIZE
    idxItem[:fields][:text] = nil
    baseSize = JSON.generate(idxItem).bytesize
    toCut = (0..text.size).bsearch { |cut|
      JSON.generate({text: text[0, text.size - cut]}).bytesize + baseSize < MAX_TEXT_SIZE
    }
    (toCut==0 || toCut.nil?) and raise("Internal error: have to cut something, but toCut=#{toCut.inspect}")
    puts "Note: Keeping only #{text.size - toCut} of #{text.size} text chars."
    idxItem[:fields][:text] = text[0, text.size - toCut]
  end

  # Make sure withdrawn items get deleted from the index
  if attrs[:suppress_content]
    idxItem = {
      type:          "delete",
      id:            itemID
    }
  end

  dbAuthors = authors.each_with_index.map { |data, idx|
    ItemAuthor.new { |auth|
      auth[:item_id] = itemID
      auth[:attrs] = JSON.generate(data)
      auth[:ordering] = idx
    }
  }

  # Calculate digests of the index data and database records
  idxData = JSON.generate(idxItem)
  idxDigest = Digest::MD5.base64digest(idxData)
  dbCombined = {
    dbItem: dbItem.to_hash,
    dbAuthors: dbAuthors.map { |authRecord| authRecord.to_hash },
    dbIssue: issue ? issue.to_hash : nil,
    dbSection: section ? section.to_hash : nil,
    units: units
  }
  dataDigest = Digest::MD5.base64digest(JSON.generate(dbCombined))

  # Add time-varying things into the database item now that we've generated a stable digest.
  dbItem[:last_indexed] = timestamp
  dbItem[:index_digest] = idxDigest
  dbItem[:data_digest] = dataDigest

  dbDataBlock = { dbItem: dbItem, dbAuthors: dbAuthors, dbIssue: issue, dbSection: section, units: units }

  # Single-item debug
  if $testMode
    #puts prefilteredData
    pp dbCombined
    fooData = idxItem.clone
    fooData[:fields] and fooData[:fields][:text] and fooData[:fields].delete(:text)
    pp fooData
    exit 1
  end

  # If nothing has changed, skip the work of updating this record.

  # Bootstrapping the addition of data digest (temporary)
  # FIXME: Remove this soon
  if existingItem && existingItem[:data_digest].nil?
    existingItem[:index_digest] = idxDigest
  end

  if existingItem && !$forceMode && existingItem[:index_digest] == idxDigest

    # If only the database portion changed, we can safely skip the CloudSearch re-indxing
    if existingItem[:data_digest] != dataDigest
      puts "Changed item. (database change only, search data unchanged)"
      $dbMutex.synchronize {
        DB.transaction do
          updateDbItem(dbDataBlock)
        end
      }
      $nProcessed += 1
      return
    end

    # Nothing changed; just update the timestamp.
    puts "Unchanged item."
    existingItem.last_indexed = timestamp
    existingItem.save
    $nUnchanged += 1
    return
  end

  puts "#{existingItem ? 'Changed' : 'New'} item.#{attrs[:suppress_content] ? " (suppressed content)" : ""}"

  # Make doubly sure the logic above didn't generate a record that's too big.
  if idxData.bytesize >= 1024*1024
    puts "idxData=\n#{idxData}\n\nInternal error: generated record that's too big."
    exit 1
  end

  # If this item won't fit in the current batch, send the current batch off and clear it.
  if batch[:idxDataSize] + idxData.bytesize > MAX_BATCH_SIZE || batch[:items].length > MAX_BATCH_ITEMS
    #puts "Prepared batch: nItems=#{batch[:items].length} size=#{batch[:idxDataSize]} "
    batch[:items].empty? or $batchQueue << batch.clone
    emptyBatch(batch)
  end

  # Now add this item to the batch
  batch[:items].empty? or batch[:idxData] << ",\n"  # Separator between records
  batch[:idxData] << idxData
  batch[:idxDataSize] += idxData.bytesize
  batch[:items] << dbDataBlock
  #puts "current batch size: #{batch[:idxDataSize]}"

end

###################################################################################################
# Index all the items in our queue
def indexAllItems
  Thread.current[:name] = "index thread"  # label all stdout from this thread
  batch = emptyBatch({})

  # The resolver and catalog stuff below is to prevent BioMed files from loading external DTDs
  # (which is not only slow but also unreliable)
  classPath = "/apps/eschol/erep/xtf/WEB-INF/lib/saxonb-8.9.jar:" +
              "/apps/eschol/erep/xtf/control/xsl/jing.jar:" +
              "/apps/eschol/erep/xtf/normalization/resolver.jar"
  Nailgun.run(classPath, 0, "-Dxml.catalog.files=/apps/eschol/erep/xtf/normalization/catalog.xml") { |nailgun|
    loop do
      # Grab an item from the input queue
      Thread.current[:name] = "index thread"  # label all stdout from this thread
      itemID, timestamp, prefilteredData = $indexQueue.pop
      itemID or break

      # Extract data and index it (in batches)
      begin
        Thread.current[:name] = "index thread: #{itemID}"  # label all stdout from this thread
        indexItem(itemID, timestamp, prefilteredData, batch, nailgun)
      rescue Exception => e
        puts "Error indexing item #{itemID}"
        raise
      end
    end
  }

  # Finish off the last batch.
  batch[:items].empty? or $batchQueue << batch
  $batchQueue << nil   # marker for end-of-queue
end

###################################################################################################
def updateIssueAndSection(data)
  iss, sec = data[:dbIssue], data[:dbSection]
  (iss && sec) or return

  found = Issue.first(unit_id: iss.unit_id, volume: iss.volume, issue: iss.issue)
  if found
    issueChanged = false
    if found.pub_date != iss.pub_date
      #puts "issue #{iss.unit_id} #{iss.volume}/#{iss.issue} pub date changed from #{found.pub_date.inspect} to #{iss.pub_date.inspect}."
      found.pub_date = iss.pub_date
      issueChanged = true
    end
    if found.attrs != iss.attrs
      #puts "issue #{iss.unit_id} #{iss.volume}/#{iss.issue} attrs changed from #{found.attrs.inspect} to #{iss.attrs.inspect}."
      found.attrs = iss.attrs
      issueChanged = true
    end
    issueChanged and found.save
    iss = found
  else
    iss.save
  end

  found = Section.first(issue_id: iss.id, name: sec.name)
  if found
    sec = found
  else
    sec.issue_id = iss.id
    sec.save
  end
  data[:dbItem][:section] = sec.id
end

###################################################################################################
def scrubSectionsAndIssues()
  # Remove orphaned sections and issues (can happen when items change)
  $dbMutex.synchronize {
    DB.run("delete from sections where id not in (select distinct section from items where section is not null)")
    DB.run("delete from issues where id not in (select distinct issue_id from sections where issue_id is not null)")
  }
end

###################################################################################################
def updateDbItem(data)
  itemID = data[:dbItem][:id]

  # Delete any existing data related to this item
  ItemAuthor.where(item_id: itemID).delete
  UnitItem.where(item_id: itemID).delete
  ItemCount.where(item_id: itemID).delete

  # Insert (or update) the issue and section
  updateIssueAndSection(data)

  # Now insert the item and its authors
  Item.where(id: itemID).delete
  data[:dbItem].save()
  data[:dbAuthors].each { |dbAuth|
    dbAuth.save()
  }

  # Copy item counts from the old stats database
  STATS_DB.fetch("SELECT * FROM itemCounts WHERE itemId = ?", itemID.sub(/^qt/, "")) { |row|
    ItemCount.insert(item_id: itemID, month: row[:month], hits: row[:hits], downloads: row[:downloads])
  }

  # Link the item to its units
  done = Set.new
  aorder = 10000
  data[:units].each_with_index { |unitID, order|
    if !done.include?(unitID)
      UnitItem.create(
        :unit_id => unitID,
        :item_id => itemID,
        :ordering_of_units => order,
        :is_direct => true
      )
      done << unitID

      $unitAncestors[unitID].each { |ancestor|
        if !done.include?(ancestor)
          UnitItem.create(
            :unit_id => ancestor,
            :item_id => itemID,
            :ordering_of_units => aorder,  # maybe should this column allow null?
            :is_direct => false
          )
          aorder += 1
          done << ancestor
        end
      }
    end
  }
end

###################################################################################################
def submitBatch(batch)
  # Try for 10 minutes max. CloudSearch seems to go awol fairly often.
  startTime = Time.now
  begin
    $csClient.upload_documents(documents: batch[:idxData], content_type: "application/json")
  rescue Exception => res
    if res.inspect =~ /Http(408|5\d\d)Error|ReadTimeout|ServiceUnavailable/ && (Time.now - startTime < 10*60)
      puts "Will retry in 30 sec, response was: #{res}"
      sleep 30; puts "Retrying."; retry
    end
    puts "Unable to retry: #{res.inspect}, elapsed=#{Time.now - startTime}"
    raise
  end
end

###################################################################################################
def processBatch(batch)
  puts "Processing batch: nItems=#{batch[:items].size}, size=#{batch[:idxDataSize]}."

  # Finish the data buffer, and send to AWS
  if !$noCloudSearchMode
    batch[:idxData] << "]"
    submitBatch(batch)
  end

  # Now that we've successfully added the documents to AWS CloudSearch, insert records into
  # our database. For efficiency, do all the records in a single transaction.
  $dbMutex.synchronize {
    DB.transaction do
      batch[:items].each { |data| updateDbItem(data) }
    end
  }

  # Periodically scrub out orphaned sections and issues
  $scrubCount += 1
  if $scrubCount > 5
    scrubSectionsAndIssues()
    $scrubCount = 0
  end

  # Update status
  $nProcessed += batch[:items].size
  puts "#{$nProcessed} processed + #{$nUnchanged} unchanged + #{$nSkipped} " +
       "skipped = #{$nProcessed + $nUnchanged + $nSkipped} of #{$nTotal} total"
end

###################################################################################################
# Process every batch in our queue
def processAllBatches
  Thread.current[:name] = "batch thread"  # label all stdout from this thread
  loop do
    # Grab a batch from the input queue
    batch = $batchQueue.pop
    batch or break

    # And process it
    processBatch(batch)
  end
end

###################################################################################################
# Delete extraneous units from prior conversions
def deleteExtraUnits(allIds)
  dbUnits = Set.new(Unit.map { |unit| unit.id })
  (dbUnits - allIds).each { |id|
    puts "Deleting extra unit: #{id}"
    DB.transaction do
      items = UnitItem.where(unit_id: id).map { |link| link.item_id }
      UnitItem.where(unit_id: id).delete
      items.each { |itemID|
        if UnitItem.where(item_id: itemID).empty?
          ItemAuthor.where(item_id: itemID).delete
          Item[itemID].delete
        end
      }

      Issue.where(unit_id: id).each { |issue|
        Section.where(issue_id: issue.id).delete
      }
      Issue.where(unit_id: id).delete

      Widget.where(unit_id: id).delete

      UnitHier.where(ancestor_unit: id).delete
      UnitHier.where(unit_id: id).delete

      Unit[id].delete
    end
  }
end

###################################################################################################
# Main driver for unit conversion.
def convertAllUnits
  # Let the user know what we're doing
  puts "Converting units."
  startTime = Time.now

  # Load allStruct and traverse it. This will create Unit and Unit_hier records for all units,
  # and delete any extraneous old ones.
  DB.transaction do
    allStructPath = "/apps/eschol/erep/xtf/style/textIndexer/mapping/allStruct-eschol5.xml"
    open(allStructPath, "r") { |io|
      convertUnits(fileToXML(allStructPath).root, {}, {}, Set.new)
    }
  end
end

###################################################################################################
def getShortArk(arkStr)
  arkStr =~ %r{^ark:/?13030/(qt\w{8})$} and return $1
  arkStr =~ /^(qt\w{8})$/ and return arkStr
  arkStr =~ /^\w{8}$/ and return "qt#{arkStr}"
  raise("Can't parse ark from #{arkStr.inspect}")
end

###################################################################################################
def cacheAllUnits()
  # Build a list of all valid units
  $allUnits = Unit.map { |unit| [unit.id, unit] }.to_h

  # Build a cache of unit ancestors
  $unitAncestors = Hash.new { |h,k| h[k] = [] }
  UnitHier.each { |hier| $unitAncestors[hier.unit_id] << hier.ancestor_unit }
end

###################################################################################################
# Main driver for item conversion
def convertAllItems(arks)
  # Let the user know what we're doing
  puts "Converting #{arks=="ALL" ? "all" : "selected"} items."

  cacheAllUnits()

  # Fire up threads for doing the work in parallel
  Thread.abort_on_exception = true
  if $prefilterMode
    prefilterThread = Thread.new { prefilterAllItems }
  end
  indexThread = Thread.new { indexAllItems }
  batchThread = Thread.new { processAllBatches }

  # Count how many total there are, for status updates
  $nTotal = QUEUE_DB.fetch("SELECT count(*) as total FROM indexStates WHERE indexName='erep'").first[:total]

  # Convert all the items that are indexable
  query = QUEUE_DB[:indexStates].where(indexName: 'erep').select(:itemId, :time).order(:itemId)
  $nTotal = query.count
  if $skipTo
    puts "Skipping all up to #{$skipTo}..."
    query = query.where{ itemId >= "ark:13030/#{$skipTo}" }
    $nSkipped = $nTotal - query.count
  end
  query.all.each do |row|   # all so we don't keep db locked
    shortArk = getShortArk(row[:itemId])
    next if arks != 'ALL' && !arks.include?(shortArk)
    erepTime = Time.at(row[:time].to_i).to_time
    item = Item[shortArk]
    if !item || item.last_indexed.nil? || item.last_indexed < erepTime || $rescanMode
      if $prefilterMode
        $prefilterQueue << [shortArk, erepTime]
      else
        $indexQueue << [shortArk, erepTime]
      end
    else
      #puts "#{shortArk} is up to date, skipping."
      $nSkipped += 1
    end
  end

  if $prefilterMode
    $prefilterQueue << nil  # end-of-queue
    prefilterThread.join
  else
    $indexQueue << nil  # end-of-queue
  end
  indexThread.join
  batchThread.join

  scrubSectionsAndIssues() # one final scrub
end

###################################################################################################
def flushInfoBatch(batch, force = false)
  if !batch[:dbUpdates].empty? && (force || batch[:idxDataSize] > MAX_BATCH_SIZE)
    puts "Submitting batch with #{batch[:dbUpdates].length} info records."
    batch[:idxData] << "]"
    submitBatch(batch)

    # Now that the data is in AWS, update the DB records.
    DB.transaction {
      batch[:dbUpdates].each { |func| func.call }
    }

    # And clear out the batch for the next round
    batch[:dbUpdates] = []
    batch[:idxData] = "["
    batch[:idxDataSize] = 0
  end
end

###################################################################################################
def indexUnit(row, batch)

  # Create JSON for the full text index
  unitID = row[:id]
  oldDigest = row[:index_digest]
  idxItem = {
    type:          "add",   # in CloudSearch land this means "add or update"
    id:            "unit:#{unitID}",
    fields: {
      text:          row[:name],
      is_info:       1
    }
  }

  # Determine campus(es), department(s), and journal(s) by tracing the unit connnections.
  addIdxUnits(idxItem, [unitID])

  idxData = JSON.generate(idxItem)
  idxDigest = Digest::MD5.base64digest(idxData)
  if oldDigest && oldDigest == idxDigest
    #puts "Unchanged: unit #{unitID}"
  else
    puts "#{oldDigest ? "Changed" : "New"}: unit #{unitID}"

    # Now add this item to the batch
    batch[:dbUpdates].empty? or batch[:idxData] << ",\n"  # Separator between records
    batch[:idxData] << idxData
    batch[:idxDataSize] += idxData.bytesize
    batch[:dbUpdates] << lambda {
      if oldDigest
        InfoIndex.where(unit_id: unitID, page_slug: nil, freshdesk_id: nil).update(index_digest: idxDigest)
      else
        InfoIndex.new { |info|
          info[:unit_id] = unitID
          info[:page_slug] = nil
          info[:freshdesk_id] = nil
          info[:index_digest] = idxDigest
        }.save
      end
    }
  end
end

###################################################################################################
def indexPage(row, batch)

  # Create JSON for the full text index
  unitID = row[:unit_id]
  slug = row[:slug]
  oldDigest = row[:index_digest]
  attrs = JSON.parse(row[:attrs])
  text = "#{$allUnits[unitID][:name]}\n#{row[:name]}\n#{row[:title]}\n"
  htmlText = attrs["html"]
  if htmlText
    buf = []
    traverseText(stringToXML(htmlText), buf)
    text += translateEntities(buf.join("\n"))
  end

  idxItem = {
    type:          "add",   # in CloudSearch land this means "add or update"
    id:            "page:#{unitID}:#{slug}",
    fields: {
      text:        text,
      is_info:     1
    }
  }

  # Determine campus(es), department(s), and journal(s) by tracing the unit connnections.
  addIdxUnits(idxItem, [unitID])

  idxData = JSON.generate(idxItem)
  idxDigest = Digest::MD5.base64digest(idxData)
  if oldDigest && oldDigest == idxDigest
    #puts "Unchanged: page #{unitID}:#{slug}"
  else
    puts "#{row[:index_digest] ? "Changed" : "New"}: page #{unitID}:#{slug}"

    # Now add this item to the batch
    batch[:dbUpdates].empty? or batch[:idxData] << ",\n"  # Separator between records
    batch[:idxData] << idxData
    batch[:idxDataSize] += idxData.bytesize
    batch[:dbUpdates] << lambda {
      if oldDigest
        InfoIndex.where(unit_id: unitID, page_slug: slug, freshdesk_id: nil).update(index_digest: idxDigest)
      else
        InfoIndex.new { |info|
          info[:unit_id] = unitID
          info[:page_slug] = slug
          info[:freshdesk_id] = nil
          info[:index_digest] = idxDigest
        }.save
      end
    }
  end
end

###################################################################################################
def deleteIndexUnit(unitID, batch)
  puts "Deleted: unit #{unitID}"
  idxItem = {
    type:          "delete",
    id:            "unit:#{unitID}"
  }
  idxData = JSON.generate(idxItem)
  batch[:dbUpdates].empty? or batch[:idxData] << ",\n"  # Separator between records
  batch[:idxData] << idxData
  batch[:idxDataSize] += idxData.bytesize
  batch[:dbUpdates] << lambda {
    InfoIndex.where(unit_id: unitID, page_slug: nil, freshdesk_id: nil).delete
  }
end

###################################################################################################
def deleteIndexPage(unitID, slug, batch)
  puts "Deleted: page #{unitID}:#{slug}"
  idxItem = {
    type:          "delete",
    id:            "page:#{unitID}:#{slug}"
  }
  idxData = JSON.generate(idxItem)
  batch[:dbUpdates].empty? or batch[:idxData] << ",\n"  # Separator between records
  batch[:idxData] << idxData
  batch[:idxDataSize] += idxData.bytesize
  batch[:dbUpdates] << lambda {
    InfoIndex.where(unit_id: unitID, page_slug: slug, freshdesk_id: nil).delete
  }
end

###################################################################################################
# Update the CloudSearch index for all info pages
def indexInfo()
  # Let the user know what we're doing
  puts "Checking and indexing info pages."

  # Build a list of all valid units
  cacheAllUnits()

  # First, the units that are new or changed
  batch = { dbUpdates: [], idxData: "[", idxDataSize: 0 }
  Unit.left_join(:info_index, unit_id: :id, page_slug: nil, freshdesk_id: nil).
       select(Sequel[:units][:id], :name, :page_slug, :freshdesk_id, :index_digest).each { |row|
    indexUnit(row, batch)
  }

  # Then the pages that are new or changed
  Page.left_join(:info_index, unit_id: :unit_id, page_slug: :slug).
       select(Sequel[:pages][:unit_id], :name, :title, :slug, :attrs, :index_digest).each { |row|
    indexPage(row, batch)
  }

  # Delete excess units and pages
  DB.fetch("SELECT unit_id FROM info_index WHERE page_slug IS NULL AND freshdesk_id IS NULL " +
           "AND NOT EXISTS (SELECT * FROM units WHERE info_index.unit_id = units.id)").each { |row|
    deleteIndexUnit(row[:unit_id], batch)
  }
  DB.fetch("SELECT unit_id, page_slug FROM info_index WHERE page_slug IS NOT NULL " +
           "AND NOT EXISTS (SELECT * FROM pages WHERE info_index.unit_id = pages.unit_id " +
           "                                      AND info_index.page_slug = pages.slug)").each { |row|
    deleteIndexPage(row[:unit_id], row[:page_slug], batch)
  }

  # Flush the last batch
  flushInfoBatch(batch, true)
end

###################################################################################################
# Main action begins here

startTime = Time.now

case ARGV[0]
  when "--units"
    convertAllUnits
  when "--items"
    arks = ARGV.select { |a| a =~ /qt\w{8}/ }
    convertAllItems(arks.empty? ? "ALL" : Set.new(arks))
  when "--info"
    indexInfo()
  else
    STDERR.puts "Usage: #{__FILE__} --units|--items"
    exit 1
end

puts "Elapsed: #{Time.now - startTime} sec."
puts "Done."
