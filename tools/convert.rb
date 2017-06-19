#!/usr/bin/env ruby

# This script converts data from old eScholarship into the new eschol5 database.
#
# The "--units" mode converts the contents of allStruct.xml and the
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
require 'json'
require 'logger'
require 'mimemagic'
require 'mimemagic/overlay' # for Office 2007+ formats
require 'nokogiri'
require 'open3'
require 'pp'
require 'rack'
require 'sanitize'
require 'sequel'
require 'ostruct'
require 'time'
require 'yaml'

# Max size (in bytes, I think) of a batch to send to AWS CloudSearch.
# According to the docs the absolute limit is 5 megs, so let's back off a
# little bit from that and say 4.5 megs.
MAX_BATCH_SIZE = 4500*1024

# Max amount of full text we'll send with any single doc. AWS limit is 1 meg, so let's
# go a little short of that so we've got room for plenty of metadata.
MAX_TEXT_SIZE  = 950*1024

DATA_DIR = "/apps/eschol/erep/data"

# The main database we're inserting data into
DB = Sequel.connect(YAML.load_file("config/database.yaml"))

# Log SQL statements, to aid debugging
File.exists?('convert.sql_log') and File.delete('convert.sql_log')
DB.loggers << Logger.new('convert.sql_log')

# The old eschol queue database, from which we can get a list of indexable ARKs
QUEUE_DB = Sequel.connect(YAML.load_file("config/queueDb.yaml"))

# Queues for thread coordination
$prefilterQueue = SizedQueue.new(100)
$indexQueue = SizedQueue.new(100)
$batchQueue = SizedQueue.new(1)  # no use getting very far ahead of CloudSearch

# Mode to force checking of the index digests (useful when indexing algorithm or unit structure changes)
$rescanMode = ARGV.delete('--rescan')

# Mode to process a single item and just print it out (no inserting or batching)
$testMode = ARGV.delete('--test')

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

# Item counts for status updates
$nSkipped = 0
$nUnchanged = 0
$nProcessed = 0
$nTotal = 0

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

class Issue < Sequel::Model
end

class Section < Sequel::Model
end

class Widget < Sequel::Model
end

class Page < Sequel::Model
end

###################################################################################################
# Insert hierarchy links (skipping dupes) for all descendants of the given unit id.
def linkUnit(id, childMap, done)
  childMap[id].each_with_index { |child, idx|
    if !done.include?([id, child])
      #puts "linkUnit: id=#{id} child=#{child}"
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
    puts "Uploading #{filePath} to S3."
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
def convertLogo(unitID, logoEl)
  # Locate the image reference
  logoImgEl = logoEl && logoEl.at("div[@id='logoDiv']/img[@src]")
  logoImgEl or return {}
  imgPath = logoImgEl && "/apps/eschol/erep/xtf/static/#{logoImgEl[:src]}"
  imgPath =~ %r{LOGO_PATH|/$} and return {} # logo never configured
  if !File.file?(imgPath)
    puts "Warning: Can't find logo image: #{imgPath.inspect}"
    return {}
  end

  mimeType = MimeMagic.by_magic(File.open(imgPath))
  mimeType && mimeType.mediatype == "image" or raise("Non-image logo file #{imgPath}")
  dims = FastImage.size(imgPath)
  assetID = putAsset(imgPath, {
    width: dims[0].to_s,
    height: dims[1].to_s
  })

  return { logo: { asset_id: assetID,
                   image_type: mimeType.subtype,
                   is_banner: logoEl.attr('banner') == "single",
                   width: dims[0],
                   height: dims[1]
                 }
         }
end

###################################################################################################
def sanitizeHTML(htmlFragment)
  return Sanitize.fragment(htmlFragment,
    elements: %w{b em i strong u} +                         # all 'restricted' tags
              %w{a br li ol p small strike sub sup ul hr},  # subset of ''basic' tags
    attributes: { 'a' => ['href'] },
    protocols:  { 'a' => {'href' => ['ftp', 'http', 'https', 'mailto', :relative]} }
  )
end

###################################################################################################
def convertBlurb(unitID, blurbEl)
  # Make sure there's a div
  divEl = blurbEl && blurbEl.at("div")
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
def convertPage(unitID, navBar, contentDiv, slug, name)
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
  navBar << { slug: slug, name: name }
end

###################################################################################################
def convertFileLink(unitID, navBar, linkName, linkTarget)
  # Locate the file referenced in the brand directory
  filePath = "/apps/eschol/erep/xtf/static/#{linkTarget}"
  if !File.file?(filePath)
    puts "Warning: Can't find brand-linked file: #{filePath.inspect}"
    return
  end

  navBar << { name: linkName, asset_id: putAsset(filePath, {}) }
end

###################################################################################################
def convertNavBar(unitID, generalEl)
  # Blow away existing database pages for this unit
  Page.where(unit_id: unitID).delete

  navBar = [ { name: "Unit Home", slug: "" } ]
  generalEl or return { navBar: navBar }

  # Convert each link in linkset
  linkedPagesUsed = Set.new
  aboutBar = nil
  generalEl.xpath("linkSet/div").each { |linkDiv|
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

      links = para.xpath("a")
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
          aboutBar = { name: "About", sub_nav: [] }
          navBar << aboutBar
        end
        addTo = aboutBar[:sub_nav]
      end

      if linkTarget =~ %r{/uc/search\?entity=[^;]+;view=([^;]+)$}
        slug = $1
        linkedPage = generalEl.at("linkedPages/div[@id=#{slug}]")
        if !linkedPage
          puts "Can't find linked page #{slug.inspect}"
          next
        end
        convertPage(unitID, addTo, linkedPage, slug, linkName)
        linkedPagesUsed << slug
      elsif linkTarget =~ %r{^https?://}
        addTo << { name: linkName, url: linkTarget }
      elsif linkTarget =~ %r{/brand/}
        convertFileLink(unitID, addTo, linkName, linkTarget)
      else
        puts "Invalid link target: #{para.inner_html}"
        next
      end
    }
  }

  # TODO: The "contactInfo" part of the brand file is supposed to end up in the "Journal Information"
  # box at the right side of the eschol UI. Database conversion TBD.
  #convertPage(unitID, navBar, generalEl.at("contactInfo/div"), "journalInfo", BLAH)

  # Note unused linked pages
  generalEl.xpath("linkedPages/div").each { |page|
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
      { name: "About", sub_nav: [] },
      { name: "Campus Sites", sub_nav: [] },
      { name: "UC Open Access", sub_nav: [] },
      { name: "eScholarship Publishing", url: "#" }
    ]
  elsif unitType == "campus"
    return [
      { name: "Open Access Policies", url: "#" },
      { name: "Journals", url: "/#{unitID}/journals" },
      { name: "Academic Units", url: "/#{unitID}/units" }
    ]
  else
    puts "Warning: no brand file found for unit #{unitID.inspect}"
    return [ { name: "Unit Home", slug: "" } ]
  end
end

###################################################################################################
def convertUnitBrand(unitID, unitType)
  begin
    dataOut = {}

    bfPath = "/apps/eschol/erep/xtf/static/brand/#{unitID}/#{unitID}.xml"
    if File.exist?(bfPath)
      dataIn = Nokogiri::XML(File.new(bfPath), &:noblanks).root
      dataOut.merge!(convertLogo(unitID, dataIn.at("display/mainFrame/logo")))
      dataOut.merge!(convertBlurb(unitID, dataIn.at("display/mainFrame/blurb")))
      if unitType == "campus"
        dataOut.merge!({ nav_bar: defaultNav(unitID, unitType) })
      else
        dataOut.merge!(convertNavBar(unitID, dataIn.at("display/generalInfo")))
      end
      dataOut.merge!(convertSocial(unitID, dataIn.xpath("display/generalInfo/linkedPages/div")))
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
  case unitType
    when "root"
      widgets << { kind: "FeaturedArticles", region: "sidebar", attrs: nil }
      widgets << { kind: "NewJournalIssues", region: "sidebar", attrs: nil }
      widgets << { kind: "Tweets", region: "sidebar", attrs: nil }
    when "campus"
      widgets << { kind: "FeaturedJournals", region: "sidebar", attrs: nil }
      widgets << { kind: "Tweets", region: "sidebar", attrs: nil }
    else
      widgets << { kind: "FeaturedArticles", region: "sidebar", attrs: nil }
  end

  widgets.each { |widgetInfo|
    Widget.create(unit_id: unitID, ordering: Widget.where(unit_id: unitID).count, **widgetInfo)
  }
end

###################################################################################################
# Convert an allStruct element, and all its child elements, into the database.
def convertUnits(el, parentMap, childMap, allIds)
  id = el[:id] || el[:ref] || "root"
  allIds << id
  #puts "name=#{el.name} id=#{id.inspect} name=#{el[:label].inspect}"

  # Create or update the main database record
  if el.name != "ref"
    puts "Converting unit #{id}."
    unitType = id=="root" ? "root" : id=="lbnl" ? "campus" : el[:type]
    Unit.update_or_replace(id,
      type:      unitType,
      name:      id=="root" ? "eScholarship" : el[:label],
      status:    el[:directSubmit] == "moribund" ? "archived" :
                 el[:hide] == "eschol" ? "hidden" :
                 "active"
    )

    # We can't totally fill in the brand attributes when initially inserting the record,
    # so do it as an update after inserting.
    attrs = {}
    el[:directSubmit] and attrs[:directSubmit] = el[:directSubmit]
    el[:hide]         and attrs[:hide]         = el[:hide]
    attrs.merge!(convertUnitBrand(id, unitType))
    Unit[id].update(attrs: JSON.generate(attrs))

    addDefaultWidgets(id, unitType)
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
    puts "Linking units."
    linkUnit("root", childMap, Set.new)

    # Delete extraneous units from prior conversions
    deleteExtraUnits(allIds)
  end
end

###################################################################################################
def prefilterBatch(batch)

  # Build a file with the relative directory names of all the items to prefilter in this batch
  timestamps = {}
  nAdded = 0
  open("prefilterDirs.txt", "w") { |io|
    batch.each { |itemID, timestamp|
      shortArk = itemID.sub(%r{^ark:/?13030/}, '')
      partialPath = "13030/pairtree_root/#{shortArk.scan(/\w\w/).join('/')}/#{shortArk}"
      metaPath = "#{DATA_DIR}/#{partialPath}/meta/#{shortArk}.meta.xml"
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

      io.puts partialPath
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
    stdoutAndErr.each { |line|

      # Filter out warning messages that get interspersed
      if line =~ /(.*)Warning: Unrecognized meta-data/
        line = $1
      elsif line =~ /(.*)WARNING: LBNL subject does not map/
        line = $1
      end

      # Look for start and end of record
      if line =~ %r{>>> BEGIN prefiltered.*/(qt\w{8})/}
        shortArk = $1
      elsif line =~ %r{>>> END prefiltered}
        # Found a full block of prefiltered data. This item is ready for indexing.
        timestamps.include?(shortArk) or
          raise("Can't find timestamp for item #{shortArk.inspect} - did we not request it?")
        $indexQueue << [shortArk, timestamps[shortArk], buf.join]
        shortArk, buf = nil, []
      elsif shortArk
        buf << line
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
  node.text? and buf << node.to_s.strip + "\n"
  node.children.each { |child| traverseText(child, buf) }
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
    doc = Nokogiri::XML(prefilteredData, &:noblanks)
    doc.remove_namespaces!
    @root = doc.root
  end

  # Get the text content of a metadata field which we expect only one of
  def single(name)
    els = @root.xpath("meta/#{name}[@meta='yes']")
    els.length <= 1 or puts("Warning: multiple #{name.inspect} elements found.")
    return els[0] ? els[0].content : nil
  end

  # Get attribute of a single metadata field
  def singleAttr(elName, attrName, default=nil)
    els = @root.xpath("meta/#{elName}[@meta='yes']")
    els.length <= 1 or puts("Warning: multiple #{elName.inspect} elements found.")
    return els[0] ? (els[0][attrName] || default) : default
  end

  # Get an array of the content from a metadata field which we expect zero or more of.
  def multiple(name, limit=nil)
    all = @root.xpath("meta/#{name}[@meta='yes']").map { |el| el.text }
    return limit ? all.slice(0, limit) : all
  end

  # Check if there are any metadata elements with the given name
  def any(name)
    return @root.xpath("meta/#{name}[@meta='yes']").length > 0
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
def parseDate(itemID, str)
  text = str
  text or return nil
  begin
    if text =~ /^\d\d\d\d$/   # handle data with no month or day
      text = "#{text}-01-01"
    elsif text =~ /^\d\d\d\d-\d\d$/   # handle data with no day
      text = "#{text}-01"
    end
    return Date.strptime(text, "%Y-%m-%d").iso8601  # throws exception on bad date
  rescue
    puts "Warning: invalid date in item #{itemID}: #{str.inspect}"
    return nil
  end
end

###################################################################################################
# Take a UCI author and make it into a string for ease of display.
def formatAuthName(auth)
  str = ""
  if auth.at("lname") && auth.at("fname")
    str = auth.at("lname").text.strip + ", " + auth.at("fname").text.strip
    auth.at("mname") and str += " " + auth.at("mname").text.strip
    auth.at("suffix") and str += ", " + auth.at("suffix").text.strip
  elsif auth.at("fname")
    str = auth.at("fname").text
  elsif auth.at("lname")
    str = auth.at("lname").text
  else
    puts "Warning: can't figure out author #{auth}"
    str = auth.text
  end
  return str
end

###################################################################################################
# Try to get fine-grained author info from UCIngest metadata; if not avail, fall back to index data.
def getAuthors(indexMeta, rawMeta)
  # If not UC-Ingest formatted, fall back on index info
  if !rawMeta.at("/record/authors")
    return indexMeta.multiple("creator").map { |name| {name: name} }
  end

  # For UC-Ingest, we can provide more detailed author info
  rawMeta.xpath("/record/authors/*").map { |el|
    if el.name == "organization"
      { name: el.text, organization: el.text }
    elsif el.name == "author"
      data = { name: formatAuthName(el) }
      el.children.each { |sub|
        if sub.name == "identifier"
          data[(sub.attr('type') + "_id").to_sym] = sub.text
        else
          data[sub.name.to_sym] = sub.text
        end
      }
      data
    else
      raise("Unknown element #{el.name.inspect} within UCIngest authors")
    end
  }
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
# Extract metadata for an item, and add it to the current index batch.
# Note that we create, but don't yet add, records to our database. We put off really inserting
# into the database until the batch has been successfully processed by AWS.
def indexItem(itemID, timestamp, prefilteredData, batch)

  # Add in the namespace declaration to the individual article (since we're taking the articles
  # out of their outer context)
  prefilteredData.sub! "<erep-article>", "<erep-article xmlns:xtf=\"http://cdlib.org/xtf\">"

  # Parse the metadata
  data = MetaAccess.new(prefilteredData)
  if data.root.nil?
    raise("Error parsing prefiltered data as XML. First part: " +
      (prefilteredData.size > 500 ? prefilteredData[0,500]+"..." : prefilteredData).inspect)
  end

  # Also grab the original metadata file
  metaPath = "#{DATA_DIR}/13030/pairtree_root/#{itemID.scan(/\w\w/).join('/')}/#{itemID}/meta/#{itemID}.meta.xml"
  rawMeta = Nokogiri::XML(File.new(metaPath), &:noblanks)
  rawMeta.remove_namespaces!
  rawMeta = rawMeta.root

  # Grab the stuff we're jamming into the JSON 'attrs' field
  attrs = {}
  data.multiple("contentExists")[0] == "yes" or attrs[:suppress_content] = true  # yes, inverting the sense
  data.single("peerReview"   ) == "yes" and attrs[:is_peer_reviewed] = true
  data.single("undergrad "   ) == "yes" and attrs[:is_undergrad] = true
  data.single("language"     )          and attrs[:language] = data.single("language")
  data.single("embargoed")              and attrs[:embargo_date] = data.single("embargoed")
  data.single("publisher")              and attrs[:publisher] = data.single("publisher")
  data.single("originalCitation")       and attrs[:orig_citation] = data.single("originalCitation")
  data.single("customCitation")         and attrs[:custom_citation] = data.single("customCitation")
  data.single("localID")                and attrs[:local_id] = { type: data.singleAttr("localID", :type, "other"),
                                                                 id:   data.single("localID") }
  data.multiple("publishedWebLocation") and attrs[:pub_web_loc] = data.multiple("publishedWebLocation")
  data.single("buyLink")                and attrs[:buy_link] = data.single("buyLink")
  if data.single("withdrawn")
    attrs[:withdrawn_date] = data.single("withdrawn")
    msg = rawMeta.at("/record/history/stateChange[@state='withdrawn']/comment")
    msg and attrs[:withdrawn_message] = msg.text
  end

  # Filter out "n/a" abstracts
  data.single("description") && data.single("description").size > 3 and attrs[:abstract] = data.single("description")

  # Disciplines are a little extra work; we want to transform numeric IDs to plain old labels
  if data.any("facet-discipline")
    attrs[:disciplines] = []
    data.multiple("facet-discipline").each { |discStr|
      discID = discStr[/^\d+/] # only the numeric part
      label = $discTbl[discID]
      label ? (attrs[:disciplines] << label) : puts("Warning: unknown discipline ID #{discID.inspect}")
    }
  end

  # Supplemental files
  supps = []
  if rawMeta.at("/record/content")
    # For UCIngest format, read supp data from the raw metadata file.
    rawMeta.xpath("/record/content/supplemental/file").each { |fileEl|
      suppAttrs = { file: fileEl[:path].sub(%r{.*content/supp/}, "") }
      fileEl.children.each { |subEl|
        suppAttrs[subEl.name] = subEl.text
      }
      supps << suppAttrs
    }
  else
    # For non-UCIngest format, read supp data from the index
    data.multiple("supplemental-file").each { |supp|
      pair = supp.split("::")
      if pair.length != 2
        puts "Warning: can't parse supp file data #{supp.inspect}"
        next
      end
      supps << { file: pair[1], title: pair[0] }
    }
  end
  suppSummaryTypes = Set.new
  if !supps.empty?
    supps.each { |supp|
      suppPath = "#{DATA_DIR}/13030/pairtree_root/#{itemID.scan(/\w\w/).join('/')}/#{itemID}/content/supp/#{supp[:file]}"
      if !File.exist?(suppPath)
        puts "Warning: can't find supp file #{supp[:file]}"
      else
        # Mime types aren't always reliable coming from Subi. Let's try harder.
        mimeType = MimeMagic.by_magic(File.open(suppPath))
        if mimeType && mimeType.type
          supp['mimeType'] = mimeType
        end
        suppSummaryTypes << mimeTypeToSummaryType(mimeType)
        (attrs[:supp_files] ||= []) << supp
      end
    }
  end

  # For eschol journals, populate the issue and section models.
  issue = section = nil
  issueNum = data.single("issue[@tokenize='no']") # untokenized is actually from "number"
  if data.single("pubType") == "journal" && data.single("volume") && issueNum
    issueUnit = data.multiple("entityOnly")[0]
    if $allUnits.include?(issueUnit)
      issue = Issue.new
      issue[:unit_id] = issueUnit
      issue[:volume]  = data.single("volume")
      issue[:issue]   = issueNum
      issue[:pub_date] = parseDate(itemID, data.single("date")) || "1901-01-01"

      section = Section.new
      section[:name]  = data.single("sectionHeader") ? data.single("sectionHeader") : "default"
    else
      "Warning: issue associated with unknown unit #{issueUnit.inspect}"
    end
  end

  # Data for external journals
  if !issue
    data.single("journal") and (attrs[:ext_journal] ||= {})[:name]   = data.single("journal")
    data.single("volume")  and (attrs[:ext_journal] ||= {})[:volume] = data.single("volume")
    issueNum               and (attrs[:ext_journal] ||= {})[:issue]  = issueNum
    data.single("issn")    and (attrs[:ext_journal] ||= {})[:issn]   = data.single("issn")
    if data.single("coverage") =~ /^([\w.]+) - ([\w.]+)$/
      (attrs[:ext_journal] ||= {})[:fpage] = $1
      (attrs[:ext_journal] ||= {})[:lpage] = $2
    end
  end

  # Detect HTML-formatted items
  contentFile = rawMeta.at("/record/content/file")
  contentFile && contentFile.at("native") and contentFile = contentFile.at("native")
  contentPath = contentFile && contentFile[:path]
  mimeType    = contentFile && contentFile.at("mimeType") && contentFile.at("mimeType").text

  # Populate the Item model instance
  dbItem = Item.new
  dbItem[:id]           = itemID
  dbItem[:source]       = data.single("source")
  dbItem[:status]       = attrs[:withdrawn_date] ? "withdrawn" :
                          attrs[:embargo_date] ? "embargoed" :
                          (rawMeta.attr("state") || "published")
  dbItem[:title]        = data.single("title")
  dbItem[:content_type] = !(data.multiple("contentExists")[0] == "yes") ? nil :
                          attrs[:withdrawn_date] ? nil :
                          attrs[:embargo_date] ? nil :
                          data.single("pdfExists") == "yes" ? "application/pdf" :
                          mimeType && mimeType.strip.length > 0 ? mimeType :
                          nil
  dbItem[:genre]        = data.single("type")
  dbItem[:pub_date]     = parseDate(itemID, data.single("date")) || "1901-01-01"
  #FIXME: Think about this carefully. What's eschol_date for?
  dbItem[:eschol_date]  = parseDate(itemID, data.single("datestamp")) || "1901-01-01"
  dbItem[:attrs]        = JSON.generate(attrs)
  dbItem[:ordering_in_sect] = data.single("document-order")

  # Do some translation on rights codes
  dbItem[:rights] = case data.single("rights")
    when "cc1"; "CC BY"
    when "cc2"; "CC BY-SA"
    when "cc3"; "CC BY-ND"
    when "cc4"; "CC BY-NC"
    when "cc5"; "CC BY-NC-SA"
    when "cc6"; "CC BY-NC-ND"
    when nil, "public"; "public"
    else puts "Unknown rights value #{data.single("rights").inspect}"
  end

  # Populate ItemAuthor model instances
  authors = getAuthors(data, rawMeta)
  dbAuthors = authors.each_with_index.map { |data, idx|
    ItemAuthor.new { |auth|
      auth[:item_id] = itemID
      auth[:attrs] = JSON.generate(data)
      auth[:ordering] = idx
    }
  }

  # Process all the text nodes
  text = ""
  traverseText(data.root, text)

  # Make a list of all the units this item belongs to
  units = data.multiple("entityOnly").select { |unitID|
    unitID =~ /^(postprints|demo-journal|test-journal|unknown|withdrawn|uciem_westjem_aip)$/ ? false :
      !$allUnits.include?(unitID) ? (puts("Warning: unknown unit #{unitID.inspect}") && false) :
      true
  }

  # It's actually ok for there to be no units, e.g. for old withdrawn items
  if units.empty?
    #do nothing
  end

  # Create JSON for the full text index
  idxItem = {
    type:          "add",   # in CloudSearch land this means "add or update"
    id:            itemID,
    fields: {
      title:         dbItem[:title] || "",
      authors:       (authors.length > 1000 ? authors[0,1000] : authors).map { |auth| auth[:name] },
      abstract:      attrs[:abstract] || "",
      type_of_work:  data.single("type"),
      content_types: data.multiple("format"),
      disciplines:   attrs[:disciplines] ? attrs[:disciplines] : [""], # only the numeric parts
      peer_reviewed: attrs[:is_peer_reviewed] ? 1 : 0,
      pub_date:      dbItem[:pub_date].to_date.iso8601 + "T00:00:00Z",
      pub_year:      dbItem[:pub_date].year,
      rights:        dbItem[:rights],
      sort_author:   (data.multiple("creator")[0] || "").gsub(/[^\w ]/, '').downcase,
    }
  }

  # Determine campus(es), department(s), and journal(s) by tracing the unit connnections.
  campuses, departments, journals, series = traceUnits(units)
  campuses.empty?    or idxItem[:fields][:campuses] = campuses
  departments.empty? or idxItem[:fields][:departments] = departments
  journals.empty?    or idxItem[:fields][:journals] = journals
  series.empty?      or idxItem[:fields][:series] = series

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

  # Calculate a digest of the index data and database records
  idxData = JSON.generate(idxItem)
  dbCombined = {
    dbItem: dbItem.to_hash,
    dbAuthors: dbAuthors.map { |authRecord| authRecord.to_hash },
    dbIssue: issue ? issue.to_hash : nil,
    dbSection: section ? section.to_hash : nil,
    units: units
  }
  dbData = JSON.generate(dbCombined)
  digest = Digest::MD5.base64digest(idxData + dbData)

  # If nothing has changed, skip the work of updating this record.
  existingItem = Item[itemID]
  if existingItem && existingItem[:index_digest] == digest && !$testMode && !$forceMode
    puts "Unchanged item."
    existingItem.last_indexed = timestamp
    existingItem.save
    $nUnchanged += 1
    return
  end
  puts "#{existingItem ? 'Changed' : 'New'} item.#{attrs[:suppress_content] ? " (suppressed content)" : ""}"

  # Add time-varying things into the database item now that we've generated a stable digest.
  dbItem[:last_indexed] = timestamp
  dbItem[:index_digest] = digest

  # Make doubly sure the logic above didn't generate a record that's too big.
  if idxData.bytesize >= 1024*1024
    puts "idxData=\n#{idxData}\n\nInternal error: generated record that's too big."
    exit 1
  end

  # If this item won't fit in the current batch, send the current batch off and clear it.
  if batch[:idxDataSize] + idxData.bytesize > MAX_BATCH_SIZE
    #puts "Prepared batch: nItems=#{batch[:items].length} size=#{batch[:idxDataSize]} "
    batch[:items].empty? or $batchQueue << batch.clone
    emptyBatch(batch)
  end

  # Now add this item to the batch
  batch[:items].empty? or batch[:idxData] << ",\n"  # Separator between records
  batch[:idxData] << idxData
  batch[:idxDataSize] += idxData.bytesize
  batch[:items] << { dbItem: dbItem, dbAuthors: dbAuthors, dbIssue: issue, dbSection: section, units: units }
  #puts "current batch size: #{batch[:idxDataSize]}"

  # Single-item debug
  if $testMode
    puts data.root.at('meta').to_s
    pp dbCombined
    fooData = idxItem.clone
    fooData[:fields] and fooData[:fields][:text] and fooData[:fields].delete(:text)
    pp fooData
    exit 1
  end
end

###################################################################################################
# Index all the items in our queue
def indexAllItems
  Thread.current[:name] = "index thread"  # label all stdout from this thread
  batch = emptyBatch({})
  loop do
    # Grab an item from the input queue
    Thread.current[:name] = "index thread"  # label all stdout from this thread
    itemID, timestamp, prefilteredData = $indexQueue.pop
    itemID or break

    # Extract data and index it (in batches)
    begin
      Thread.current[:name] = "index thread: #{itemID}"  # label all stdout from this thread
      indexItem(itemID, timestamp, prefilteredData, batch)
    rescue Exception => e
      puts "Error indexing item #{itemID}"
      raise
    end
  end

  # Finish off the last batch.
  batch[:items].empty? or $batchQueue << batch
  $batchQueue << nil   # marker for end-of-queue
end

###################################################################################################
def processBatch(batch)
  puts "Processing batch: nItems=#{batch[:items].size}, size=#{batch[:idxDataSize]}."

  # Finish the data buffer, and send to AWS
  if !$noCloudSearchMode
    batch[:idxData] << "]"
    # Try for 10 minutes max. CloudSearch seems to go awol fairly often.
    startTime = Time.now
    begin
      $csClient.upload_documents(documents: batch[:idxData], content_type: "application/json")
    rescue Exception => res
      if res.inspect =~ /Http(408|5\d\d)Error/ && (Time.now - startTime < 10*60)
        puts "Will retry in 30 sec, response was: #{res}"
        sleep 30; puts "Retrying."; retry
      end
      puts "Unable to retry: #{res.inspect}"
      raise
    end
  end

  # Now that we've successfully added the documents to AWS CloudSearch, insert records into
  # our database. For efficience, do all the records in a single transaction.
  DB.transaction do

    # Do each item in the batch
    batch[:items].each { |data|
      itemID = data[:dbItem][:id]

      # Delete any existing data related to this item (except counts which can stay)
      ItemAuthor.where(item_id: itemID).delete
      UnitItem.where(item_id: itemID).delete

      # Insert (or update) the issue and section
      iss, sec = data[:dbIssue], data[:dbSection]
      if iss
        found = Issue.first(unit_id: iss.unit_id, volume: iss.volume, issue: iss.issue)
        if found
          iss = found
        else
          iss.save
        end
        if sec
          found = Section.first(issue_id: iss.id, name: sec.name)
          if found
            sec = found
          else
            sec.issue_id = iss.id
            sec.save
          end
          data[:dbItem][:section] = sec.id
        end
      end

      # Now insert the item and its authors
      Item.where(id: itemID).delete
      data[:dbItem].save()
      data[:dbAuthors].each { |dbAuth|
        dbAuth.save()
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
    }
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
    allStructPath = "/apps/eschol/erep/xtf/style/textIndexer/mapping/allStruct.xml"
    open(allStructPath, "r") { |io|
      convertUnits(Nokogiri::XML(io, &:noblanks).root, {}, {}, Set.new)
    }
  end
end

###################################################################################################
# Main driver for item conversion
def convertAllItems(arks)
  # Let the user know what we're doing
  puts "Converting #{arks=="ALL" ? "all" : "selected"} items."

  # Build a list of all valid units
  $allUnits = Unit.map { |unit| [unit.id, unit] }.to_h

  # Build a cache of unit ancestors
  $unitAncestors = Hash.new { |h,k| h[k] = [] }
  UnitHier.each { |hier| $unitAncestors[hier.unit_id] << hier.ancestor_unit }

  # Fire up threads for doing the work in parallel
  Thread.abort_on_exception = true
  prefilterThread = Thread.new { prefilterAllItems }
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
    shortArk = row[:itemId].sub(%r{^ark:/?13030/}, '')
    next if arks != 'ALL' && !arks.include?(shortArk)
    erepTime = Time.at(row[:time].to_i).to_time
    item = Item[shortArk]
    if !item || item.last_indexed.nil? || item.last_indexed < erepTime || $rescanMode
      $prefilterQueue << [shortArk, erepTime]
    else
      #puts "#{shortArk} is up to date, skipping."
      $nSkipped += 1
    end
  end

  $prefilterQueue << nil  # end-of-queue
  prefilterThread.join
  indexThread.join
  batchThread.join
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
  else
    STDERR.puts "Usage: #{__FILE__} --units|--items"
    exit 1
end

puts "Elapsed: #{Time.now - startTime} sec."
puts "Done."
