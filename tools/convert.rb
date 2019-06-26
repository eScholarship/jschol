#!/usr/bin/env ruby

# This script converts data from old eScholarship into the new eschol5 database.
#
# The "--items" mode converts combined an XTF index dump with the contents of
# UCI metadata files into the items/sections/issues/etc. tables. It is also
# built to be fully incremental.

# Run from the right directory (the parent of the tools dir)
Dir.chdir(File.dirname(File.expand_path(File.dirname(__FILE__))))

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'aws-sdk'
require 'date'
require 'digest'
require 'ezid-client'
require 'fastimage'
require 'fileutils'
require 'httparty'
require 'json'
require 'logger'
require 'mimemagic'
require 'mimemagic/overlay' # for Office 2007+ formats
require 'mini_magick'
require 'netrc'
require 'nokogiri'
require 'open3'
require 'ostruct'
require 'pp'
require 'rack'
require 'sanitize'
require 'sequel'
require 'time'
require 'unindent'
require_relative '../util/nailgun.rb'
require_relative '../util/normalize.rb'
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

TEMP_DIR = "/apps/eschol/eschol5/jschol/tmp"
FileUtils.mkdir_p(TEMP_DIR)

# The main database we're inserting data into
DB = Sequel.connect({
  "adapter"  => "mysql2",
  "host"     => ENV["ESCHOL_DB_HOST"] || raise("missing env ESCHOL_DB_HOST"),
  "port"     => ENV["ESCHOL_DB_PORT"] || raise("missing env ESCHOL_DB_PORT").to_i,
  "database" => ENV["ESCHOL_DB_DATABASE"] || raise("missing env ESCHOL_DB_DATABASE"),
  "username" => ENV["ESCHOL_DB_USERNAME"] || raise("missing env ESCHOL_DB_USERNAME"),
  "password" => ENV["ESCHOL_DB_PASSWORD"] || raise("missing env ESCHOL_DB_HOST") })
$dbMutex = Mutex.new

# Log SQL statements, to aid debugging
File.exists?('convert.sql_log') and File.delete('convert.sql_log')
#DB.loggers << Logger.new('convert.sql_log')

# The old eschol queue database, from which we can get a list of indexable ARKs
QUEUE_DB = Sequel.connect({ adapter: "sqlite",
                            database: "/apps/eschol/erep/xtf/control/db/queues.db",
                            readonly: true,
                            timeout: 30000 })

# The old stats database, from which we can copy item counts
STATS_DB = Sequel.connect({ adapter: "sqlite",
                            database: "/apps/eschol/erep/xtf/stats/stats.db",
                            readonly: true,
                            timeout: 600000 })

# Queues for thread coordination
$indexQueue = SizedQueue.new(100)
$batchQueue = SizedQueue.new(1)  # no use getting very far ahead of CloudSearch
$splashQueue = Queue.new

# Mode to force checking of the index digests (useful when indexing algorithm or unit structure changes)
RESCAN_SET_SIZE = 2000
$rescanMode = ARGV.delete('--rescan')

# Mode to process a single item and just print it out (no inserting or batching)
$testMode = ARGV.delete('--test')

# Mode to override up-to-date test
$forceMode = ARGV.delete('--force')
$forceMode and $rescanMode = true

# Pre-indexing mode (avoids locking, doesn't touch search index)
$preindexMode = false

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
$csClient = Aws::CloudSearchDomain::Client.new(credentials: Aws::InstanceProfileCredentials.new,
  endpoint: ENV['CLOUDSEARCH_DOC_ENDPOINT'] || raise("missing env CLOUDSEARCH_DOC_ENDPOINT"))

# S3 API client
# Note: we use InstanceProfileCredentials here to avoid picking up ancient
#       credentials file pub-submit-prd:~/.aws/config
$s3Client = Aws::S3::Client.new(credentials: Aws::InstanceProfileCredentials.new,
                                region: ENV['S3_REGION'] || raise("missing env S3_REGION"))
$s3Bucket = Aws::S3::Bucket.new(ENV['S3_BUCKET'] || raise("missing env S3_BUCKET"), client: $s3Client)

# Caches for speed
$allUnits = nil
$unitAncestors = nil
$unitChildren = nil
$issueCoverCache = {}
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
$thumbnailServer = ENV["THUMBNAIL_SERVER"] || raise("missing env THUMBNAIL_SERVER")

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

$issueRightsCache = {}

$oaPolicyDate = { lbnl:    "2015-10-01",
                  ucsf:    "2012-05-21",
                  ucop:    nil,  # not included for now; maybe will be: 2015-10-23
                  anrcs:   nil,  # not included for now
                  default: "2013-07-24" }

###################################################################################################
# Configure EZID API for minting arks for people
Ezid::Client.configure do |config|
  (ezidCred = Netrc.read['ezid.cdlib.org']) or raise("Need credentials for ezid.cdlib.org in ~/.netrc")
  config.user = ezidCred[0]
  config.password = ezidCred[1]
  config.default_shoulder = ENV["PEOPLE_ARK_SHOULDER"] || raise("missing env PEOPLE_ARK_SHOULDER")
end

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

require_relative './models.rb'
require_relative '../splash/splashGen.rb'

###################################################################################################
$issueBuyLinks = Hash[*File.readlines("/apps/eschol/erep/xtf/style/textIndexer/mapping/buyLinks.txt", 
                                      :encoding => 'UTF-8').map { |line|
  line =~ %r{^.*entity=(.*);volume=(.*);issue=(.*)\|(.*?)\s*$} ? ["#{$1}:#{$2}:#{$3}", $4] : [nil, line]
}.flatten]
# Retain buy-link overrides in eschol5
Issue.where(Sequel.lit("attrs->'$.buy_link' is not null")).each { |record|
  $issueBuyLinks["#{record.unit_id}:#{record.volume}:#{record.issue}"] = JSON.parse(record.attrs)['buy_link']
}

###################################################################################################
# Upload an asset file to S3 (if not already there), and return the asset ID. Attaches a hash of
# metadata to it.
def putAsset(filePath, metadata)

  # Calculate the sha256 hash, and use it to form the s3 path
  md5sum    = Digest::MD5.file(filePath).hexdigest
  sha256Sum = Digest::SHA256.file(filePath).hexdigest
  s3Path = "#{ENV['S3_PREFIX'] || raise("missing env S3_PREFIX")}/binaries/#{sha256Sum[0,2]}/#{sha256Sum[2,2]}/#{sha256Sum}"

  # If the S3 file is already correct, don't re-upload it.
  obj = $s3Bucket.object(s3Path)
  if !obj.exists? || obj.etag != "\"#{md5sum}\""
    #puts "Uploading #{filePath} to S3."
    obj.put(body: File.new(filePath),
            metadata: metadata.merge({
              original_path: filePath.sub(%r{.*/([^/]+/[^/]+)$}, '\1'), # retain only last directory plus filename
              mime_type: MimeMagic.by_magic(File.open(filePath)).to_s
            }))
    # 2018-06-01: Is AWS introducing a introducing a new kind of etag? This occasionally fails.
    # obj.etag == "\"#{md5sum}\"" or raise("S3 returned md5 #{resp.etag.inspect} but we expected #{md5sum.inspect}")
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
def arkToFile(ark, subpath, root = DATA_DIR)
  shortArk = getShortArk(ark)
  path = "#{root}/13030/pairtree_root/#{shortArk.scan(/\w\w/).join('/')}/#{shortArk}/#{subpath}"
  return path.sub(%r{^/13030}, "13030").gsub(%r{//+}, "/").gsub(/\bbase\b/, shortArk).sub(%r{/+$}, "")
end

###################################################################################################
# Traverse XML, looking for indexable text to add to the buffer.
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
    #puts "Warning: no text found"
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
# Given a list of units, figure out which campus(es), department(s), and journal(s) are responsible.
def traceUnits(units)
  firstCampus = nil
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
        firstCampus ||= unitID
        campuses << unitID
      elsif unit.type == "oru"
        departments << unitID
      elsif unit.type =~ /series$/
        series << unitID
      end
      units += $unitAncestors[unitID]
    end
  end

  return [firstCampus, campuses.to_a, departments.to_a, journals.to_a, series.to_a]
end

###################################################################################################
def parseDate(str)
  text = str
  text or return nil
  begin
    if text =~ /^([123]\d\d\d)([01]\d)([0123]\d)$/  # handle date missing its dashes
      text = "#{$1}-#{$2}-#{$3}"
    elsif text =~ /^\d\d\d\d$/   # handle data with no month or day
      text = "#{text}-01-01"
    elsif text =~ /^\d\d\d\d-\d\d$/   # handle data with no day
      text = "#{text}-01"
    end
    ret = Date.strptime(text, "%Y-%m-%d")  # throws exception on bad date
    ret.year > 1000 && ret.year < 4000 and return ret.iso8601
  rescue
    begin
      text.sub! /-02-(29|30|31)$/, "-02-28" # Try to fix some crazy dates
      ret = Date.strptime(text, "%Y-%m-%d")  # throws exception on bad date
      ret.year > 1000 && ret.year < 4000 and return ret.iso8601
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
# Try to get fine-grained author info from UCIngest metadata
def getAuthors(metaEls, role)
  result = metaEls.map { |el|
    if el.name == "organization"
      { name: el.text, organization: el.text }
    elsif %w{author editor advisor}.include?(el.name)
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
  role != "author" and result.each { |data| data[:role] = role }
  return result
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
def closeTempFile(file)
  begin
    file.close
    rescue Exception => e
    # ignore
  end
  file.unlink
end

###################################################################################################
def generatePdfThumbnail(itemID, inMeta, existingItem)
  begin
    pdfPath = arkToFile(itemID, "content/base.pdf")
    File.exist?(pdfPath) or return nil
    pdfTimestamp = File.mtime(pdfPath).to_i
    cover = inMeta.at("./content/cover/file[@path]")
    cover and coverPath = arkToFile(itemID, cover[:path])
    if (coverPath and File.exist?(coverPath))
      tempFile0 = Tempfile.new("thumbnail")
      # perform appropriate 90 degree rotation on the image to orient the image for correct viewing 
      MiniMagick::Tool::Convert.new do |convert|
        convert << coverPath 
        convert.auto_orient
        convert << tempFile0.path
      end
      temp1 = MiniMagick::Image.open(tempFile0.path)
      # Resize to 150 pixels wide if bigger than that 
      if (temp1.width > 150)
        temp1.resize (((150.0/temp1.width.to_i).round(4) * 100).to_s + "%")
        tempFile1 = Tempfile.new("thumbnail")
        begin
          temp1.write(tempFile1) 
          data = putImage(tempFile1.path)
        ensure
          closeTempFile(tempFile1)
        end
      else
        data = putImage(coverPath)
      end
      closeTempFile(tempFile0)
      data[:timestamp] = pdfTimestamp
      data[:is_cover] = true
      return data
    else
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
      # Rip 1st page
      url = "#{$thumbnailServer}/uc/item/#{itemID.sub(/^qt/, '')}?image.view=generateImage;imgWidth=121;pageNum=1"
      response = HTTParty.get(url)
      response.code.to_i == 200 or raise("Error generating thumbnail: HTTP #{response.code}: #{response.message}")
      tempFile2 = Tempfile.new("thumbnail")
      begin
        tempFile2.write(response.body)
        tempFile2.close
        data = putImage(tempFile2.path) { |dims|
          dims[0] == 121 or raise("Got thumbnail width #{dims[0]}, wanted 121")
          dims[1] < 300 or raise("Got thumbnail height #{dims[1]}, wanted less than 300")
        }
        data[:timestamp] = pdfTimestamp
        return data
      ensure
        closeTempFile(tempFile2)
      end
    end
  rescue Exception => e
    puts "Warning: error generating thumbnail: #{e}: #{e.backtrace.join("; ")}"
    return nil
  end
end

###################################################################################################
# See if we can find a cover image for the given issue. If so, add it to dbAttrs.
def findIssueCover(unit, volume, issue, caption, dbAttrs)
  key = "#{unit}:#{volume}:#{issue}"
  if !$issueCoverCache.key?(key)
    # Check the special directories for a cover image.
    filename = "#{volume.rjust(2,'0')}_#{issue.rjust(2,'0')}_cover"
    imgPath = nil
    # Try a couple old directories, and both possible file extensions (for JPEG and PNG images)
    ["/apps/eschol/erep/xtf/static/issueCovers", "/apps/eschol/erep/xtf/static/brand"].each { |staticDir|
      ["jpg", "png"].each { |ext|
        path = "#{staticDir}/#{unit}/#{volume.rjust(2,'0')}_#{issue.rjust(2,'0')}_cover.#{ext}"
        File.exist?(path) and imgPath = path
      }
    }
    data = nil
    if imgPath
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
  key = "#{issueUnit}:#{volNum}:#{issueNum}"
  if !$issueNumberingCache.key?(key)
    numbering = nil
    # First, check for existing issue numbering
    iss = Issue.where(unit_id: issueUnit, volume: volNum, issue: issueNum).first
    if iss
      issAttrs = (iss.attrs && JSON.parse(iss.attrs)) || {}
      numbering = issAttrs["numbering"]
    else
      # Failing that, check for a default set on the unit
      unit = $allUnits[issueUnit]
      unitAttrs = unit && unit.attrs && JSON.parse(unit.attrs) || {}
      if unitAttrs["default_issue"] && unitAttrs["default_issue"]["numbering"]
        numbering = unitAttrs["default_issue"]["numbering"]
      else
        # Failing that, use values from the most-recent issue
        iss = Issue.where(unit_id: issueUnit).order(Sequel.desc(:published)).order_append(Sequel.desc(:issue)).first
        if iss
          issAttrs = (iss.attrs && JSON.parse(iss.attrs)) || {}
          numbering = issAttrs["numbering"]
        end
      end
    end
    $issueNumberingCache[key] = numbering
  end

  # Finally, stuff the cached value into the output attrs for this issue
  $issueNumberingCache[key] and issueAttrs[:numbering] = $issueNumberingCache[key]
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

  #puts "Warning: content-free item"
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
def addMerrittPaths(itemID, attrs)
  feed = fileToXML(arkToFile(itemID, "meta/base.feed.xml"))
  feed.remove_namespaces!
  feed = feed.root

  # First, find the path of the main PDF content file
  pdfSize = File.size(arkToFile(itemID, "content/base.pdf")) or raise
  pdfFound = false
  feed.xpath("//link").each { |link|
    if link[:rel] == "http://purl.org/dc/terms/hasPart" &&
         link[:type] == "application/pdf" &&
         link[:length].to_i == pdfSize &&
         link[:title] =~ %r{^producer/}
      attrs[:content_merritt_path] = link[:title]
      pdfFound = true
      break
    end
  }
  pdfFound or puts "Warning: can't find merritt path for pdf"

  # Then do any supp files
  attrs[:supp_files] and attrs[:supp_files].each { |supp|
    suppName = supp[:file]
    suppSize = File.size(arkToFile(itemID, "content/supp/#{suppName}")) or raise
    supp[:size] = suppSize
    suppFound = false
    feed.xpath("//link").each { |link|
      if link[:rel] == "http://purl.org/dc/terms/hasPart" &&
           link[:length].to_i == suppSize &&
           link[:title].gsub(/[^\w]/, '').include?(suppName.gsub(/[^\w]/, ''))
        supp[:merritt_path] = link[:title]
        suppFound = true
        break
      end
    }
    suppFound or puts "Warning: can't find merritt path for supp #{suppName}"
  }
end

###################################################################################################
# If an issue's rights have been overridden in eschol5, be sure to prefer that. Likewise, if there's
# a default, take that instead. Failing that, use the most recent issue. If there isn't one, use
# whatever eschol5 came up with.
def checkRightsOverride(unitID, volNum, issNum, oldRights)
  key = "#{unitID}|#{volNum}|#{issNum}"
  if !$issueRightsCache.key?(key)
    # First, check for existing issue rights
    iss = Issue.where(unit_id: unitID, volume: volNum, issue: issNum).first
    if iss
      issAttrs = (iss.attrs && JSON.parse(iss.attrs)) || {}
      rights = issAttrs["rights"]
    else
      # Failing that, check for a default set on the unit
      unit = $allUnits[unitID]
      unitAttrs = unit && unit.attrs && JSON.parse(unit.attrs) || {}
      if unitAttrs["default_issue"] && unitAttrs["default_issue"]["rights"]
        rights = unitAttrs["default_issue"]["rights"]
      else
        # Failing that, use values from the most-recent issue
        iss = Issue.where(unit_id: unitID).order(Sequel.desc(:published)).order_append(Sequel.desc(:issue)).first
        if iss
          issAttrs = (iss.attrs && JSON.parse(iss.attrs)) || {}
          rights = issAttrs["rights"]
        else
          # Failing that, just use whatever rights eschol4 came up with.
          rights = oldRights
        end
      end
    end
    $issueRightsCache[key] = rights
  end
  return $issueRightsCache[key]
end

###################################################################################################
def parseUCIngest(itemID, inMeta, fileType)
  attrs = {}
  attrs[:addl_info] = inMeta.html_at("./comments") and sanitizeHTML(inMeta.html_at("./comments"))
  attrs[:author_hide] = !!inMeta.at("./authors[@hideAuthor]")   # Only journal items can have this attribute
  attrs[:bepress_id] = inMeta.text_at("./context/bpid")
  attrs[:book_title] = inMeta.text_at("./context/bookTitle")
  attrs[:buy_link] = inMeta.text_at("./context/buyLink")
  attrs[:custom_citation] = inMeta.text_at("./customCitation")
  attrs[:doi] = inMeta.text_at("./doi")
  attrs[:embargo_date] = parseDate(inMeta[:embargoDate])
  attrs[:is_peer_reviewed] = inMeta[:peerReview] == "yes"
  attrs[:is_undergrad] = inMeta[:underGrad] == "yes"
  attrs[:isbn] = inMeta.text_at("./context/isbn")
  attrs[:language] = inMeta.text_at("./context/language")
  attrs[:local_ids] = inMeta.xpath("./context/localID").map { |el| { type: el[:type], id: el.text } }
  attrs[:orig_citation] = inMeta.text_at("./originalCitation")
  attrs[:pub_status] = inMeta[:pubStatus]
  attrs[:pub_web_loc] = inMeta.xpath("./context/publishedWebLocation").map { |el| el.text.strip }
  attrs[:publisher] = inMeta.text_at("./publisher")
  attrs[:suppress_content] = shouldSuppressContent(itemID, inMeta)

  # Record submitter (especially useful for forensics)
  attrs[:submitter] = inMeta.xpath("./history/stateChange").map { |sc|
    sc[:state] =~ /^(new|uploaded|pending|published)/ && sc[:who] ? sc[:who] : nil
  }.compact[0]

  # Normalize language codes
  attrs[:language] and attrs[:language] = attrs[:language].sub("english", "en").sub("german", "de").
                                                           sub("french", "fr").sub("spanish", "es")

  # Set disableDownload flag based on content file
  tmp = inMeta.at("./content/file[@disableDownload]")
  tmp && tmp = parseDate(tmp[:disableDownload]) and attrs[:disable_download] = tmp

  isJunk = false
  if inMeta[:state] == "withdrawn"
    tmp = inMeta.at("./history/stateChange[@state='withdrawn']")
    tmp and attrs[:withdrawn_date] = tmp[:date].sub(/T.+$/, "")
    if !attrs[:withdrawn_date]
      puts "Warning: no withdraw date found; using stateDate."
      attrs[:withdrawn_date] = inMeta[:stateDate]
    end

    tmp = inMeta.text_at("./history/stateChange[@state='withdrawn']/comment")
    tmp and attrs[:withdrawn_message] = tmp
    tmp =~ /spam|junk|violation.*policy/i and isJunk = true

    tmp = inMeta.text_at("./history/stateChange[@state='withdrawn']/internalComment")
    tmp and attrs[:withdrawn_internal_comment] = tmp
  end

  # Everything needs a submission date
  parseDate(inMeta[:dateStamp]).nil? and raise("missing datestamp")
  submissionDate = parseDate(inMeta.text_at("./history/submissionDate"))
  if submissionDate.nil? || submissionDate > parseDate(inMeta[:dateStamp])
    submissionDate = parseDate(inMeta[:dateStamp])
  end

  # Figure out the published date as well
  publishedDate = parseDate(inMeta.text_at("./history/originalPublicationDate")) ||
                  parseDate(inMeta.text_at("./history/escholPublicationDate")) ||
                  submissionDate

  # Also we need the date it was added to eScholarship. For sanity, clamp dates before
  # it was even submitted.
  escholDate = parseDate(inMeta.text_at("./history/escholPublicationDate"))
  addDate = (escholDate && escholDate > submissionDate) ? escholDate : submissionDate
  if addDate.nil? || addDate < submissionDate
    addDate = submissionDate
  elsif addDate > parseDate(inMeta[:dateStamp])  # rare crazy dates
    addDate = parseDate(inMeta[:dateStamp])
  end

  # Similar for update date
  begin
    updateTime = DateTime.parse(inMeta[:dateStamp]) || DateTime.now
  rescue
    updateTime = DateTime.now
  end
  if updateTime.to_date.iso8601 < submissionDate
    updateTime = Date.parse(submissionDate).to_datetime  # sanity
  elsif updateTime > DateTime.now
    updateTime = DateTime.now  # sanity
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
    #label or puts("Warning: unknown discipline #{discEl}")
    label
  }.select { |v| v }

  # Subjects and keywords come directly across.
  attrs[:subjects] = inMeta.xpath("./subjects/subject").map { |el| el.text.strip }
  # Sometimes keywords are separated into elements, sometimes lumped as a delimited list within an element.
  attrs[:keywords] = inMeta.xpath("./keywords/keyword").map { |el| el.text.split(/[,;]/).map { |t| t.strip } }.flatten

  # Grab grant data and other stuff for OSTI reporting
  attrs[:grants] = inMeta.xpath("./funding/grant").map { |el| el.to_h }
  attrs[:uc_pms_pub_type] = inMeta.text_at("./context/ucpmsPubType")
  attrs[:proceedings] = inMeta.text_at("./context/proceedings")

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
  if inMeta[:state] != "withdrawn" and (issueNum or volNum)
    issueUnit = inMeta.xpath("./context/entity[@id]").select {
                      |ent| $allUnits[ent[:id]] && $allUnits[ent[:id]].type == "journal" }[0]
    issueUnit and issueUnit = issueUnit[:id]
    if issueUnit
      # Data for eScholarship journals
      if $allUnits.include?(issueUnit)
        volNum.nil? and raise("missing volume number on eschol journal item")

        # Prefer eschol5 rights overrides to eschol4.
        rights = checkRightsOverride(issueUnit, volNum, issueNum, rights)

        issue = Issue.new
        issue[:unit_id]  = issueUnit
        issue[:volume]   = volNum
        issue[:issue]    = issueNum
        if inMeta.text_at("./context/issueDate") == "0"  # hack for westjem AIP
          issue[:published] = parseDate(inMeta.text_at("./history/originalPublicationDate") ||
                                        inMeta.text_at("./history/escholPublicationDate") ||
                                        submissionDate)
        else
          issue[:published] = parseDate(inMeta.text_at("./context/issueDate") ||
                                        inMeta.text_at("./history/originalPublicationDate") ||
                                        inMeta.text_at("./history/escholPublicationDate") ||
                                        submissionDate)
        end
        issueAttrs = {}
        tmp = inMeta.text_at("/record/context/issueTitle")
        tmp and issueAttrs[:title] = tmp
        tmp = sanitizeHTML(inMeta.html_at("/record/context/issueDescription"))
        tmp and issueAttrs[:description] = tmp
        tmp = inMeta.text_at("/record/context/issueCoverCaption")
        findIssueCover(issueUnit, volNum, issueNum, tmp, issueAttrs)
        addIssueBuyLink(issueUnit, volNum, issueNum, issueAttrs)
        addIssueNumberingAttrs(issueUnit, volNum, issueNum, issueAttrs)
        rights and issueAttrs[:rights] = rights
        !issueAttrs.empty? and issue[:attrs] = issueAttrs.to_json

        section = Section.new
        section[:name] = inMeta.text_at("./context/sectionHeader") || "Articles"
        ord = inMeta.text_at("./context/publicationOrder").to_i
        section[:ordering] = ord > 0 ? ord : nil
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
    attrs[:thumbnail] = generatePdfThumbnail(itemID, inMeta, Item[itemID])
  end

  # Remove empty attrs
  attrs.reject! { |k, v| !v || (v.respond_to?(:empty?) && v.empty?) }

  # Detect HTML-formatted items
  contentFile = inMeta.at("/record/content/file[@path]")
  contentFile && contentFile.at("./native[@path]") and contentFile = contentFile.at("./native")
  contentType = contentFile && contentFile.at("./mimeType") && contentFile.at("./mimeType").text

  # Record name of native file, if any
  if contentFile && contentFile.name == "native" && contentFile[:path]
    nativePath = arkToFile(itemID, contentFile[:path].sub(/.*\//, 'content/'))
    if File.exist?(nativePath)
      attrs[:native_file] = { name: contentFile[:path].sub(/.*\//, ''),
                              size: File.size(nativePath) }
    end
  end

  # For ETDs (all in Merritt), figure out the PDF path in the feed file
  pdfPath = arkToFile(itemID, "content/base.pdf")
  pdfExists = File.file?(pdfPath)
  if pdfExists
    if fileType == "ETD" && pdfExists
      addMerrittPaths(itemID, attrs)
    end
    attrs[:content_length] = File.size(pdfPath)
  elsif contentType == "application/pdf"
    contentType = nil   # whatever cruft we got from the mimeType field, no PDF is no PDF.
  end

  # Populate the Item model instance
  dbItem = Item.new
  dbItem[:id]           = itemID
  dbItem[:source]       = inMeta.text_at("./source") or raise("no source found")
  dbItem[:status]       = isJunk ? "withdrawn-junk" :
                          attrs[:withdrawn_date] ? "withdrawn" :
                          isEmbargoed(attrs[:embargo_date]) ? "embargoed" :
                          (attrs[:suppress_content] && inMeta[:state] == "published") ? "empty" :
                          (inMeta[:state] || raise("no state in record"))
  dbItem[:title]        = sanitizeHTML(inMeta.html_at("./title"))
  dbItem[:content_type] = attrs[:suppress_content] ? nil :
                          attrs[:withdrawn_date] ? nil :
                          isEmbargoed(attrs[:embargo_date]) ? nil :
                          inMeta[:type] == "non-textual" ? nil :
                          pdfExists ? "application/pdf" :
                          contentType && contentType.strip.length > 0 ? contentType :
                          nil
  dbItem[:genre]        = (!attrs[:suppress_content] &&
                           dbItem[:content_type].nil? &&
                           attrs[:supp_files]) ? "multimedia" :
                          fileType == "ETD" ? "dissertation" :
                          inMeta[:type] ? inMeta[:type].sub("paper", "article") :
                          "article"
  dbItem[:submitted]    = submissionDate
  dbItem[:added]        = addDate
  dbItem[:published]    = publishedDate
  dbItem[:updated]      = updateTime
  dbItem[:attrs]        = JSON.generate(attrs)
  dbItem[:rights]       = rights
  dbItem[:ordering_in_sect] = inMeta.text_at("./context/publicationOrder")

  # Populate ItemAuthor model instances
  authors = getAuthors(inMeta.xpath("//authors/*"), "author")
  contribs = getAuthors(inMeta.xpath("//editors/*"), "editor") +
             getAuthors(inMeta.xpath("//advisors/*"), "advisor")

  # Make a list of all the units this item belongs to
  units = inMeta.xpath("./context/entity[@id]").map { |ent| ent[:id] }.select { |unitID|
    unitID =~ /^(postprints|demo-journal|test-journal|unknown|withdrawn|uciem_westjem_aip)$/ ? false :
      !$allUnits.include?(unitID) ? (puts("Warning: unknown unit #{unitID.inspect}") && false) :
      true
  }

  return dbItem, attrs, authors, contribs, units, issue, section, suppSummaryTypes
end

###################################################################################################
def processWithNormalizer(fileType, itemID, metaPath, nailgun)
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
  ## This was only really useful during development of the normalizers
  #schemaPath = "/apps/eschol/erep/xtf/schema/uci_schema.rnc"
  #validationProbs = nailgun.call("com.thaiopensource.relaxng.util.Driver", ["-c", schemaPath, normFile], true)
  #if !validationProbs.empty?
  #  validationProbs.split("\n").each { |line|
  #    next if line =~ /missing required element "(subject|mimeType)"/ # we don't care
  #    puts line.sub(/.*norm.xml:/, "")
  #  }
  #end

  # And parse the data
  return parseUCIngest(itemID, normXML.root, fileType)
end

###################################################################################################
# Clean title, to help w/sorting
# Remove first character if it's not alphanumeric
# Remove beginning 'The' pronouns
# Note: CloudSearch sorts by Unicode codepoint, so numbers come before letters and uppercase letters come before lowercase letters
def cleanTitle(str)
  str.nil? and return str
  r = Sanitize.clean(str).strip
  str.empty? and return str
  r = (r[0].match /[^\w]/) ? r[1..-1].strip : r
  r.sub(/^(The|A|An) /i, '').capitalize
end

###################################################################################################
def addIdxUnits(idxItem, units)
  firstCampus, campuses, departments, journals, series = traceUnits(units)
  campuses.empty?    or idxItem[:fields][:campuses] = campuses
  departments.empty? or idxItem[:fields][:departments] = departments
  journals.empty?    or idxItem[:fields][:journals] = journals
  series.empty?      or idxItem[:fields][:series] = series
  return firstCampus
end

###################################################################################################
def oaPolicyAssoc(campus, units, dbItem, pubStatus)
  campus or return nil
  policyDate = $oaPolicyDate.key?(campus.to_sym) ? $oaPolicyDate[campus.to_sym] : $oaPolicyDate[:default]

  #old
  # To try and match old 2017 Accountability Report numbers, filter out items submitted since then
  #isCovered = dbItem[:submitted].iso8601 <= "2017-04-28" &&
  #            !policyDate.nil? &&
  #            ['externalAccept', 'externalPub'].include?(pubStatus) &&
  #            ['article', 'multimedia', 'chapter', 'non-textual'].include?(dbItem[:genre]) &&
  #            dbItem[:published].iso8601.sub(/-01-01$/, '-12-31') >= policyDate

  #new-ish
  #isCovered = dbItem[:submitted].iso8601 <= "2017-04-28" &&
  #            !policyDate.nil? &&
  #            (campus == 'lbnl' || units.include?("#{campus}_postprints")) &&
  #            %w{published withdrawn embargoed}.include?(dbItem[:status]) &&
  #            [nil, 'externalAccept', 'externalPub'].include?(pubStatus) &&
  #            %w{article chapter}.include?(dbItem[:genre]) &&
  #            dbItem[:published].iso8601.sub(/-01-01$/, '-12-31') >= policyDate &&
  #            dbItem[:submitted].iso8601 >= policyDate

  # Current
  isCovered = !policyDate.nil? &&
              (campus == 'lbnl' || units.include?("#{campus}_postprints")) &&
              %w{published}.include?(dbItem[:status]) &&
              [nil, 'externalAccept', 'externalPub'].include?(pubStatus) &&
              ['article', 'chapter'].include?(dbItem[:genre]) &&
              dbItem[:published].iso8601.sub(/-01-01$/, '-12-31') >= policyDate &&
              dbItem[:submitted].iso8601 >= policyDate
  return isCovered ? campus : nil
end

###################################################################################################
# Extract metadata for an item, and add it to the current index batch.
# Note that we create, but don't yet add, records to our database. We put off really inserting
# into the database until the batch has been successfully processed by AWS.
def indexItem(itemID, timestamp, batch, nailgun)

  # Grab the main metadata file
  metaPath = arkToFile(itemID, "meta/base.meta.xml")
  if !File.exists?(metaPath) || File.size(metaPath) < 50
    #puts "Warning: skipping #{itemID} due to missing or truncated meta.xml"
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
    dbItem, attrs, authors, contribs, units, issue, section, suppSummaryTypes =
      processWithNormalizer(normalize, itemID, metaPath, nailgun)
  else
    dbItem, attrs, authors, contribs, units, issue, section, suppSummaryTypes =
      parseUCIngest(itemID, rawMeta, "UCIngest")
  end

  text = grabText(itemID, dbItem.content_type)
  
  # Create JSON for the full text index
  idxItem = {
    type:          "add",   # in CloudSearch land this means "add or update"
    id:            itemID,
    fields: {
      title:         dbItem[:title] ? cleanTitle(dbItem[:title]) : "",
      authors:       (authors.length > 1000 ? authors[0,1000] : authors).map { |auth| auth[:name] } +
                     (contribs.length > 1000 ? contribs[0,1000] : contribs).map { |c| c[:name] },
      abstract:      attrs[:abstract] || "",
      type_of_work:  dbItem[:genre],
      disciplines:   attrs[:disciplines] ? attrs[:disciplines] : [""], # only the numeric parts
      peer_reviewed: attrs[:is_peer_reviewed] ? 1 : 0,
      pub_date:      dbItem[:published].to_date.iso8601 + "T00:00:00Z",
      pub_year:      dbItem[:published].year,
      rights:        dbItem[:rights] || "",
      sort_author:   (authors[0] || {name:""})[:name].gsub(/[^\w ]/, '').downcase,
      keywords:      attrs[:keywords] ? attrs[:keywords] : [""],
      is_info:       0
    }
  }

  # Determine campus(es), department(s), and journal(s) by tracing the unit connnections.
  firstCampus = addIdxUnits(idxItem, units)

  # Use the first campus and various other attributes to make an OA policy association
  dbItem[:oa_policy] = oaPolicyAssoc(firstCampus, units, dbItem, attrs[:pub_status])

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
    #puts "Note: Keeping only #{text.size - toCut} of #{text.size} text chars."
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

  roleCounts = Hash.new { |h,k| h[k] = 0 }
  dbContribs = contribs.each_with_index.map { |data, idx|
    ItemContrib.new { |contrib|
      contrib[:item_id] = itemID
      contrib[:role] = data[:role]
      data.delete(:role)
      contrib[:attrs] = JSON.generate(data)
      contrib[:ordering] = (roleCounts[contrib[:role]] += 1)
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
  dbContribs.empty? or dbCombined[:dbContribs] = dbContribs.map { |record| record.to_hash }
  dataDigest = Digest::MD5.base64digest(JSON.generate(dbCombined))

  # Add time-varying things into the database item now that we've generated a stable digest.
  dbItem[:last_indexed] = timestamp
  dbItem[:index_digest] = idxDigest
  dbItem[:data_digest] = dataDigest

  dbDataBlock = { dbItem: dbItem, dbAuthors: dbAuthors, dbContribs: dbContribs,
                  dbIssue: issue, dbSection: section, units: units }

  # Single-item debug
  if $testMode
    pp dbCombined
    fooData = idxItem.clone
    fooData[:fields] and fooData[:fields][:text] and fooData[:fields].delete(:text)
    pp fooData
    exit 1
  end

  # If nothing has changed, skip the work of updating this record.
  if existingItem && !$forceMode && existingItem[:index_digest] == idxDigest

    # If only the database portion changed, we can safely skip the CloudSearch re-indxing
    if existingItem[:data_digest] != dataDigest
      puts "Changed item. (database change only, search data unchanged)"
      $dbMutex.synchronize {
        DB.transaction do
          updateDbItem(dbDataBlock)
        end
      }
      # Check/update the splash page now that this item has a real record
      $splashQueue << itemID
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
  begin
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
        itemID, timestamp = $indexQueue.pop
        itemID or break

        # Extract data and index it (in batches)
        begin
          Thread.current[:name] = "index thread: #{itemID}"  # label all stdout from this thread
          indexItem(itemID, timestamp, batch, nailgun)
        rescue Exception => e
          puts "Error indexing item #{itemID}"
          raise
        end

        # To avoid Saxon's Java process from growing gigantic, restart it once in a while.
        nailgun.callCount == 1000 and nailgun.restart
      end
    }

    # Finish off the last batch.
    batch[:items].empty? or $batchQueue << batch
  rescue Exception => e
    puts "Exception in indexAllItems: #{e} #{e.backtrace}"
  ensure
    $batchQueue << nil   # marker for end-of-queue
  end
end

###################################################################################################
def updateIssueAndSection(data)
  iss, sec = data[:dbIssue], data[:dbSection]
  (iss && sec) or return

  found = Issue.first(unit_id: iss.unit_id, volume: iss.volume, issue: iss.issue)
  if found
    issueChanged = false
    if found.published != iss.published
      #puts "issue #{iss.unit_id} #{iss.volume}/#{iss.issue} pub date " +
      #changed from #{found.published.inspect} to #{iss.published.inspect}."
      found.published = iss.published
      issueChanged = true
    end
    if found.attrs != iss.attrs
      #puts "issue #{iss.unit_id} #{iss.volume}/#{iss.issue} attrs " +
      #"changed from #{found.attrs.inspect} to #{iss.attrs.inspect}."
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
    secChanged = false
    if found.ordering != sec.ordering
      found.ordering = sec.ordering
      secChanged = true
    end
    begin
      secChanged and found.save
    rescue Exception => e
      if e.to_s =~ /Duplicate entry/
        puts "Warning: couldn't update section order due to ordering constraint. Ignoring."
      else
        raise
      end
    end
    sec = found
  else
    sec.issue_id = iss.id
    begin
      sec.save
    rescue Exception => e
      if e.to_s =~ /Duplicate entry/
        puts "Warning: couldn't update section order due to ordering constraint. Ignoring."
        sec.ordering = nil
        sec.save
      else
        raise
      end
    end
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

  # Delete any existing data related to this item, except the item record itself (which is used
  # as a foreign key in stats tables).
  ItemAuthor.where(item_id: itemID).delete
  ItemContrib.where(item_id: itemID).delete
  UnitItem.where(item_id: itemID).delete
  data['dbSection'].nil? and Item.where(id: itemID).update(section: nil)

  # Insert (or update) the issue and section
  updateIssueAndSection(data)

  # Now create/insert the item, and insert its authors (and other contributors if any)
  data[:dbItem].create_or_update()
  data[:dbAuthors].each { |record| record.save() }
  data[:dbContribs] and data[:dbContribs].each { |record| record.save }

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

    # Process splash pages now that all the DB records exist
    batch[:items].each { |data| $splashQueue << data[:dbItem][:id] }
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
  $splashQueue << nil # mark no more coming
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

  # Build a cache of unit ancestors and children
  $unitAncestors = Hash.new { |h,k| h[k] = [] }
  $unitChildren = Hash.new { |h,k| h[k] = [] }
  UnitHier.order(:ordering).each { |hier|
    $unitAncestors[hier.unit_id] << hier.ancestor_unit
    hier.is_direct and $unitChildren[hier.ancestor_unit] << hier.unit_id
  }
end

###################################################################################################
def createPersonArk(name, email)
  # Determine the EZID metadata
  who = email ? "#{name} <#{email}>" : name
  meta = { 'erc.what' => normalizeERC("Internal eScholarship agent ID"),
           'erc.who'  => "#{normalizeERC(name)} <#{normalizeERC(email)}>",
           'erc.when' => DateTime.now.iso8601 }

  # Mint it the new ID
  resp = Ezid::Identifier.mint(nil, meta)
  return resp.id
end

###################################################################################################
# Connect people to authors
def connectAuthors

  # Skip if all authors were already connected
  unconnectedAuthors = ItemAuthor.where(Sequel.lit("attrs->'$.email' is not null and person_id is null"))
  nTodo = unconnectedAuthors.count
  nTodo > 0 or return

  # First, record existing email -> person correlations
  puts "Connecting items/authors to people."
  emailToPerson = {}
  Person.where(Sequel.lit("attrs->'$.email' is not null")).each { |person|
    attrs = JSON.parse(person.attrs)
    next if attrs['forwarded_to']
    Set.new([attrs['email']] + (attrs['prev_emails'] || [])).each { |email|
      if emailToPerson.key?(email) && emailToPerson[email] != person.id
        puts "Warning: multiple matching people for email #{email.inspect}"
      end
      emailToPerson[email] = person.id
    }
  }

  # Then connect all unconnected authors to people
  nDone = 0
  unconnectedAuthors.each { |auth|
    DB.transaction {
      authAttrs = JSON.parse(auth.attrs)
      email = authAttrs["email"].downcase
      person = emailToPerson[email]
      (nDone % 1000) == 0 and puts "Connecting items/authors to people: #{nDone} / #{nTodo}"
      if !person
        person = createPersonArk(authAttrs["name"] || "unknown", email)
        Person.create(id: person, attrs: { email: email }.to_json)
        emailToPerson[email] = person
      end
      ItemAuthor.where(item_id: auth.item_id, ordering: auth.ordering).update(person_id: person)
      nDone += 1
    }
  }
  puts "Connecting items/authors to people: #{nDone} / #{nTodo}"
end

###################################################################################################
# Main driver for item conversion
def convertAllItems(arks)
  # Let the user know what we're doing
  puts "Converting #{arks=="ALL" ? "all" : "selected"} items."

  cacheAllUnits()
  genAllStruct()

  # Normally loop runs once, but in rescan mode it's multiple times.
  rescanBase = ""
  while true

    # Fire up threads for doing the work in parallel
    Thread.abort_on_exception = true
    indexThread = Thread.new { indexAllItems }
    batchThread = Thread.new { processAllBatches }
    splashThread = Thread.new { splashFromQueue }

    if $preindexMode
      arks.each { |ark|
        ark =~ /^qt\w{8}$/ or raise("Invalid ark #{ark.inspect}")
        $indexQueue << [ark, nil]
      }
    else

      # Count how many total there are, for status updates
      $nTotal = QUEUE_DB.fetch("SELECT count(*) as total FROM indexStates WHERE indexName='erep'").first[:total]

      # If we've been asked to rescan everything, do so in batches.
      if $rescanMode
        if arks == 'ALL'
          redoSet = Item.where{ id > rescanBase }.limit(RESCAN_SET_SIZE)
          $skipTo and redoSet = redoSet.where{ id >= $skipTo }
          $skipTo = nil
          redoSet.update(:last_indexed => nil)
          rescanBase = redoSet.map(:id).max
          puts "Rescan reset, nextbase=#{rescanBase.inspect}."
        else
          rescanBase = nil
        end
      end

      # Grab the timestamps of all items, for speed
      allItemTimes = (arks=="ALL" ? Item : Item.where(id: arks.to_a)).to_hash(:id, :last_indexed)

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
        itemTime = allItemTimes[shortArk]
        if itemTime.nil? || itemTime < erepTime || ($rescanMode && arks.include?(shortArk))
          $indexQueue << [shortArk, erepTime]
        else
          #puts "#{shortArk} is up to date, skipping."
          $nSkipped += 1
        end
      end
    end

    $indexQueue << nil  # end-of-queue
    indexThread.join
    if !$testMode && !($hostname =~ /-dev|-stg/)
      connectAuthors  # make sure all newly converted (or reconvered) items have author->people links
    end
    batchThread.join
    splashThread.join

    if $rescanMode && rescanBase.nil?
      break
    elsif !$rescanMode
      break
    end
  end

  $nTotal > 0 and scrubSectionsAndIssues() # one final scrub
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
    id:            "page:#{unitID}:#{slug.gsub(%r{[^-a-zA-Z0-9\_\/\#\:\.\;\&\=\?\@\$\+\!\*'\(\)\,\%]}, '_')}",
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
# Main driver for PDF display version generation
def convertPDF(itemID)
  item = Item[itemID]

  # Skip non-published items (e.g. embargoed, withdrawn)
  if item.status != "published"
    #puts "Not generating splash for #{item.status} item."
    DisplayPDF.where(item_id: itemID).delete  # delete splash pages when item gets withdrawn
    return
  end

  # Generate the splash instructions, for cache checking
  attrs = JSON.parse(item.attrs)
  instrucs = splashInstrucs(itemID, item, attrs)
  instrucDigest = Digest::MD5.base64digest(instrucs.to_json)

  # See if current splash page is adequate
  origFile = arkToFile(itemID, "content/base.pdf")
  if !File.exist?(origFile)
    #puts "Missing content file; skipping splash."
    return
  end
  origSize = File.size(origFile)
  origTimestamp = File.mtime(origFile)

  dbPdf = DisplayPDF[itemID]
  # It's odd, but comparing timestamps by value isn't reliable. Converting them to strings is though.
  if !$forceMode && dbPdf && dbPdf.orig_size == origSize && dbPdf.orig_timestamp.to_s == origTimestamp.to_s
    #puts "Splash unchanged."
    return
  end
  puts "Updating splash."

  # Linearize the original PDF
  linFile, linDiff, splashLinFile, splashLinDiff = nil, nil, nil, nil
  begin
    # First, linearize the original file. This will make the first page display quickly in our
    # pdf.js view on the item page.
    linFile = Tempfile.new(["linearized_#{itemID}_", ".pdf"], TEMP_DIR)
    system("/apps/eschol/bin/qpdf --linearize #{origFile} #{linFile.path}")
    code = $?.exitstatus
    code == 0 || code == 3 or raise("Error #{code} linearizing.")
    linSize = File.size(linFile.path)

    # Then generate a splash page, and linearize that as well.
    splashLinFile = Tempfile.new(["splashLin_#{itemID}_", ".pdf"], TEMP_DIR)
    splashLinSize = 0
    begin
      splashLinSize = splashGen(itemID, instrucs, linFile, splashLinFile.path)
    rescue Exception => e
      if e.to_s =~ /Internal Server Error/
        puts "Warning: splash generator failed; falling back to plain."
      else
        raise
      end
    end

    pfx = ENV['S3_PREFIX'] || raise("missing env S3_PREFIX")
    $s3Bucket.object("#{pfx}/pdf_patches/linearized/#{itemID}").put(body: linFile)
    splashLinSize > 0 and $s3Bucket.object("#{pfx}/pdf_patches/splash/#{itemID}").put(body: splashLinFile)

    DisplayPDF.where(item_id: itemID).delete
    DisplayPDF.create(item_id: itemID,
      orig_size:          origSize,
      orig_timestamp:     origTimestamp,
      linear_size:        linSize,
      splash_info_digest: splashLinSize > 0 ? instrucDigest : nil,
      splash_size:        splashLinSize
    )

    puts sprintf("Splash updated: lin=%d/%d = %.1f%%; splashLin=%d/%d = %.1f%%",
                 linSize, origSize, linSize*100.0/origSize,
                 splashLinSize, origSize, splashLinSize*100.0/origSize)
  ensure
    linFile and linFile.unlink
    linDiff and linDiff.unlink
    splashLinFile and splashLinFile.unlink
    splashLinDiff and splashLinDiff.unlink
  end
end

###################################################################################################
def splashFromQueue
  Thread.current[:name] = "splash thread"
  loop do
    # Grab an item from the input queue
    itemID = $splashQueue.pop
    itemID or break
    Thread.current[:name] = "splash thread: #{itemID}"  # label all stdout from this thread
    begin
      convertPDF(itemID)
    rescue Exception => e
      e.is_a?(Interrupt) || e.is_a?(SignalException) and raise
      puts "Exception: #{e} #{e.backtrace}"
    end
    Thread.current[:name] = "splash thread"
  end
end

###################################################################################################
# Main driver for PDF display version generation
def splashAllPDFs(arks)
  # Let the user know what we're doing
  puts "Splashing #{arks=="ALL" ? "all" : "selected"} PDFs."

  # Start a couple worker threads to do the splash conversions.
  splashThread = Thread.new { splashFromQueue }

  # Grab all the arks
  if arks == "ALL"
    Item.where(content_type: "application/pdf").order(:id).each { |item|
      $splashQueue << item.id
    }
  else
    arks.each { |item| $splashQueue << item }
  end

  $splashQueue << nil # mark end-of-queue
  splashThread.join
end

###################################################################################################
def flushDbQueue(queue)
  DB.transaction { queue.each { |func| func.call } }
  queue.clear
end

###################################################################################################
def recalcOA
  puts "Reading units and item links."
  cacheAllUnits
  itemUnits = Hash.new { |h,k| h[k] = [] }
  UnitItem.where(is_direct: 1).order(:ordering_of_units).each { |link|
    itemUnits[link.item_id] << link.unit_id
  }
  puts "Processing items."
  toUpdate = []
  Item.each { |item|
    units = itemUnits[item.id]
    units or next
    firstCampus, campuses, departments, journals, series = traceUnits(units)
    firstCampus or next
    attrs = item.attrs.nil? ? {} : JSON.parse(item.attrs)
    newPol = oaPolicyAssoc(firstCampus, units, item, attrs['pub_status'])
    if !(newPol == item.oa_policy)
      puts "item=#{item.id} submitted=#{item.submitted} oa_policy: #{item.oa_policy.inspect} -> #{newPol.inspect}"
      toUpdate << [item.id, newPol]
    end
  }
  puts "Updating #{toUpdate.length} item records."
  DB.transaction {
    toUpdate.each { |itemID, newPol|
      Item.where(id: itemID).update(oa_policy: newPol)
    }
  }
end

###################################################################################################
def genDivChildren(xml, parentID, generatedDivs)
  $unitChildren[parentID].each { |unitID|
    if generatedDivs.include?(unitID)
      xml.ptr(ref: unitID)
    else
      unit = $allUnits[unitID]
      unitAttrs = JSON.parse(unit.attrs)
      divAttrs = {id: unitID, label: unit.name, type: unit.type}
      unitAttrs['directSubmit'] and divAttrs[:directSubmit] = unitAttrs['directSubmit']
      unitAttrs['hide'] and divAttrs[:hide] = unitAttrs['hide']
      if unitAttrs['eissn']
        divAttrs[:issn] = unitAttrs['eissn']
      elsif unitAttrs['issn']
        divAttrs[:issn] = unitAttrs['issn']
      end
      unitAttrs['elements_id'] and divAttrs[:elementsID] = unitAttrs['elements_id']
      unitAttrs['is_undergrad'] and divAttrs[:undergrad] = unitAttrs['is_undergrad']
      unitAttrs['submit_datasets'] and divAttrs[:dataSet] = unitAttrs['submit_datasets']
      xml.div(divAttrs) {
        genDivChildren(xml, unitID, generatedDivs)
      }
      generatedDivs << unitID
    end
  }
end

###################################################################################################
# Regenerate the old allStruct.xml file that Subi and eschol4 controller depend upon
def genAllStruct
  cacheAllUnits
  builder = Nokogiri::XML::Builder.new { |xml|
    xml.allStruct {
      genDivChildren(xml, "root", Set.new)
    }
  }

  allStructDir = "/apps/eschol/erep/xtf/style/textIndexer/mapping"
  File.open("#{allStructDir}/allStruct-new.xml", "w") { |io|
    io.write(builder.to_xml)
  }
  File.rename("#{allStructDir}/allStruct-new.xml", "#{allStructDir}/allStruct.xml")
end

###################################################################################################
# Allstruct checking (temporary during transition from hand-edited to auto-generated allStruct)
def extractDivsInner(el, addTo)
  el.elements.each { |sub|
    if sub.name == "div"
      addTo.key?(sub[:id]) and puts("Warning: dupe #{sub}")
      addTo[sub[:id]] = sub.clone
    end
    extractDivsInner(sub, addTo)
  }
end

def extractDivs(path)
  xml = fileToXML(path)
  addTo = {}
  extractDivsInner(xml, addTo)
  return addTo
end

def fixUnitAttr(unitID, attrName, newVal)
  puts "    Fixing unit #{unitID} attr #{attrName}=#{newVal.inspect}"
  unit = Unit[unitID]
  attrs = JSON.parse(unit.attrs)
  attrs[attrName] = newVal
  unit.attrs = attrs.to_json
  unit.save
end

def checkAllStruct
  puts "Checking."
  oldDivs = extractDivs("/apps/eschol/erep/xtf/style/textIndexer/mapping/allStruct.xml.orig")
  newDivs = extractDivs("/apps/eschol/erep/xtf/style/textIndexer/mapping/allStruct.xml")
  (Set.new(oldDivs.keys) + Set.new(newDivs.keys)).each { |id|
    oldDiv = oldDivs[id]
    newDiv = newDivs[id]
    if !oldDiv
      puts "  Excess new div for id=#{id}"
    elsif !newDiv
      puts "  Missing new div for id=#{id}"
    else
      (Set.new(oldDiv.attributes.keys) + Set.new(newDiv.attributes.keys)).each { |attrName|
        next if attrName =~ /^(customFields|seriesBrandFile|label)$/
        next if oldDiv[attrName] == newDiv[attrName]
        if !oldDiv[attrName]
          puts "  Extra attr #{attrName}=#{newDiv[attrName].inspect} for unit #{id}"
        else
          if !newDiv[attrName]
            next if attrName == "directSubmit" && oldDiv[attrName] == "enabled"  # enabled same as nil default
            puts "  Missing attr #{attrName}=#{oldDiv[attrName].inspect} for unit #{id}"
          else
            puts "  Attr diff: old #{attrName}=#{oldDiv[attrName].inspect} vs new #{newDiv[attrName].inspect} for unit #{id}"
          end
          if attrName == "elementsID"
            fixUnitAttr(id, "elements_id", oldDiv[attrName])
          elsif attrName == "undergrad"
            fixUnitAttr(id, "is_undergrad", oldDiv[attrName])
          elsif attrName == "dataSet"
            fixUnitAttr(id, "submit_datasets", oldDiv[attrName])
          end
        end
      }
    end
  }
end

###################################################################################################
# Main action begins here

startTime = Time.now

# Pre-index mode: no locking, just index one item and get out
if ARGV[0] == "--preindex"
  $preindexMode = $noCloudSearchMode = $forceMode = true
  $rescanMode = false # prevent infinite loop
  convertAllItems(Set.new([ARGV[1]]))
  exit 0
end

# MH: Could not for the life of me get File.flock to actually do what it
#     claims, so falling back to file existence check.
lockFile = "/tmp/jschol_convert.lock"
File.exist?(lockFile) or FileUtils.touch(lockFile)
lock = File.new(lockFile)
begin
  if !lock.flock(File::LOCK_EX | File::LOCK_NB)
    puts "Another copy is already running."
    exit 1
  end

  case ARGV[0]
    when "--items"
      arks = ARGV.select { |a| a =~ /qt\w{8}/ }
      convertAllItems(arks.empty? ? "ALL" : Set.new(arks))
    when "--info"
      indexInfo()
    when "--splash"
      arks = ARGV.select { |a| a =~ /qt\w{8}/ }
      splashAllPDFs(arks.empty? ? "ALL" : Set.new(arks))
    when "--oa"
      recalcOA
    when "--checkAllStruct"
      checkAllStruct
    when "--genAllStruct"
      cacheAllUnits
      genAllStruct
    else
      STDERR.puts "Usage: #{__FILE__} --units|--items"
      exit 1
  end

  puts "Elapsed: #{Time.now - startTime} sec."
  puts "Done."
ensure
  lock.flock(File::LOCK_UN)
end
