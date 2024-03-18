#!/usr/bin/env ruby

# This script converts data from old eScholarship into the new eschol5 database.
#
# The "--items" mode converts the contents of UCI metadata files into the
# items/sections/issues/etc. tables.

# Run from the right directory (the parent of the tools dir)
Dir.chdir(File.dirname(File.expand_path(File.dirname(__FILE__))))

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'aws-sdk-cloudsearch'
require 'aws-sdk-cloudsearchdomain'
require 'aws-sdk-s3'
require 'date'
require 'digest'
#require 'ezid-client'
require 'fastimage'
require 'fileutils'
require 'httparty'
require 'json'
require 'logger'
require 'mimemagic'
require 'mini_magick'
require 'netrc'
require 'nokogiri'
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
require_relative './subprocess.rb'

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

def getEnv(name)
  return ENV[name] || raise("missing env #{name}")
end

# The main database we're inserting data into
DB = Sequel.connect({
  "adapter"  => "mysql2",
  "host"     => getEnv("ESCHOL_DB_HOST"),
  "port"     => getEnv("ESCHOL_DB_PORT").to_i,
  "database" => getEnv("ESCHOL_DB_DATABASE"),
  "username" => getEnv("ESCHOL_DB_USERNAME"),
  "password" => getEnv("ESCHOL_DB_PASSWORD") })
$dbMutex = Mutex.new

# Log SQL statements, to aid debugging
File.exist?('convert.sql_log') and File.delete('convert.sql_log')
DB.loggers << Logger.new('convert.sql_log')

# Queues for thread coordination
$indexQueue = SizedQueue.new(100)
$batchQueue = SizedQueue.new(1)  # no use getting very far ahead of CloudSearch

# Mode to process a single item and just print it out (no inserting or batching)
$testMode = ARGV.delete('--test')

# Mode to override up-to-date test
$forceMode = ARGV.delete('--force')

# Used to disable certain features on dev/stg
$hostname = `/bin/hostname`.strip

# Pre-indexing mode (fast - doesn't touch search index)
$preindexMode = false

# Mode to skip CloudSearch indexing and just do db updates
$noCloudSearchMode = ARGV.delete('--noCloudSearch')

# CloudSearch API client
$csClient = Aws::CloudSearchDomain::Client.new(credentials: Aws::InstanceProfileCredentials.new,
  endpoint: getEnv("CLOUDSEARCH_DOC_ENDPOINT"))

# S3 API client
# Note: we use InstanceProfileCredentials here to avoid picking up ancient
#       credentials file pub-submit-prd:~/.aws/config
$s3Client = Aws::S3::Client.new(credentials: Aws::InstanceProfileCredentials.new,
                                region: getEnv("S3_REGION"))
$s3Bucket = Aws::S3::Bucket.new(getEnv("S3_BUCKET"), client: $s3Client)

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
$thumbnailServer = getEnv("THUMBNAIL_SERVER")

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

$issueRightsCache = {}

$oaPolicyDate = { lbnl:    "2015-10-01",
                  ucsf:    "2012-05-21",
                  ucop:    nil,  # not included for now; maybe will be: 2015-10-23
                  anrcs:   nil,  # not included for now
                  default: "2013-07-24" }

###################################################################################################
# Configure EZID API for minting arks for people
if ENV.include? "PEOPLE_ARK_SHOULDER"
  require 'ezid-client'
  Ezid::Client.configure do |config|
    (ezidCred = Netrc.read['ezid.cdlib.org']) or raise("Need credentials for ezid.cdlib.org in ~/.netrc")
    config.user = ezidCred[0]
    config.password = ezidCred[1]
    config.default_shoulder = getEnv("PEOPLE_ARK_SHOULDER")
  end
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
  sha256Sum = Digest::SHA256.file(filePath).hexdigest
  s3Path = "#{getEnv("S3_BINARIES_PREFIX")}/#{sha256Sum[0,2]}/#{sha256Sum[2,2]}/#{sha256Sum}"

  # If the S3 file is already present, don't re-upload it.
  obj = $s3Bucket.object(s3Path)
  if !obj.exists? || $forceMode
    #puts "Uploading #{filePath} to S3."
    obj.put(body: File.new(filePath),
            metadata: metadata.merge({
              original_path: filePath.sub(%r{.*/([^/]+/[^/]+)$}, '\1'), # retain only last directory plus filename
              mime_type: MimeMagic.by_magic(File.open(filePath)).to_s
            }))
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
def rawArkToFile(shortArk, subpath, root = DATA_DIR)
  path = "#{root}/13030/pairtree_root/#{shortArk.scan(/\w\w/).join('/')}/#{shortArk}/#{subpath}"
  return path.sub(%r{^/13030}, "13030").gsub(%r{//+}, "/").gsub(/\bbase\b/, shortArk).sub(%r{/+$}, "")
end

###################################################################################################
def arkToFile(ark, subpath, root = DATA_DIR)
  shortArk = getShortArk(ark)
  metaPath =
  useNext = ""
  if !File.exist?(rawArkToFile(shortArk, "meta/base.meta.xml")) && File.exist?(rawArkToFile(shortArk, "next/meta/base.meta.xml"))
    useNext = "next/"
  end
  path = "#{root}/13030/pairtree_root/#{shortArk.scan(/\w\w/).join('/')}/#{shortArk}/#{useNext}#{subpath}"
  return path.sub(%r{^/13030}, "13030").gsub(%r{//+}, "/").gsub(/\bbase\b/, shortArk).sub(%r{/+$}, "")
end

###################################################################################################
class StringBuf
  def initialize
    @buf = []
    @length = 0
  end

  def << (str)
    @buf << str
    @length += str.length
  end

  def to_s
    return @buf.join("\n")
  end

  def length
    return @length
  end
end

###################################################################################################
# Traverse XML, looking for indexable text to add to the buffer. Stops if the text size exceeds
# the max amount we can index (MAX_TEXT_SIZE).
def traverseText(node, buf)
  return if node['meta'] == "yes" || node['index'] == "no"
  return if buf.length > MAX_TEXT_SIZE
  node.text? and buf << node.to_s.strip
  node.children.each { |child| traverseText(child, buf) }
end

###################################################################################################
def grabText(itemID, contentType)
  buf = StringBuf.new
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
  return translateEntities(buf.to_s)
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
      text.sub!(/-02-(29|30|31)$/, "-02-28") # Try to fix some crazy dates
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
        temp1.resize(((150.0/temp1.width.to_i).round(4) * 100).to_s + "%")
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
      if existingThumb && existingThumb["timestamp"] == pdfTimestamp && !$forceMode && !$preindexMode
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
      response.code.to_i == 200 or raise("Error generating thumbnail: url=#{url} code=#{response.code} message=#{response.message.inspect}")
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
# From https://rosettacode.org/wiki/Longest_Common_Substring#Ruby
def longest_common_substring(a,b)
  lengths = Array.new(a.length){Array.new(b.length, 0)}
  greatestLength = 0
  output = ""
  a.each_char.with_index do |x,i|
    b.each_char.with_index do |y,j|
      next if x != y
      lengths[i][j] = (i.zero? || j.zero?) ? 1 : lengths[i-1][j-1] + 1
      if lengths[i][j] > greatestLength
        greatestLength = lengths[i][j]
        output = a[i - greatestLength + 1, greatestLength]
      end
    end
  end
  output
end

###################################################################################################
def parseCustomTOC(itemID)
  file = arkToFile(itemID, "meta/base.toc.xml")
  File.exist?(file) or return nil
  input = fileToXML(file).root
  divs = input.xpath("div") + input.xpath("fm/div") + input.xpath("body/div") + input.xpath("bm/div")
  return { source: "custom",
           divs: divs.map { |div|
             { title: (div[:type] == 'chapter' && div[:num] && !(div[:title] =~ /chapter/i)) ?
                        "Chapter #{div[:num]}. #{div[:title]}" : div[:title],
               page: div[:page]
             }
           }
         }
end

###################################################################################################
def filterTOCDivs(divs)

  # Remove duplicate lines, e.g. qt00h9x985:
  #   1. Introduction #1,0,842
  #   1. Introduction #2,54,781
  #   1. Introduction #2,54,781
  divs = divs.map.with_index { |div, idx|
    (idx >= 1 && div[:title] == divs[idx-1][:title]) ? nil : div
  }.compact

  # Remove "link_" lines, e.g. qt01g5w8m8:
  #   link_CR1        #16
  #   link_CR2        #17
  divs.reject! { |div| div[:title] =~ /^link/ }

  # Remove "p. " lines, e.g. qt01w2r6sh:
  #   p. 36
  #   p. 37
  divs.reject! { |div| div[:title] =~ /^p\b/i }

  # Remove individual references, e.g. qt0243w7p5
  #   Reference 1
  #   Reference 2
  #   Reference 3
  divs.reject! { |div| div[:title] =~ /^reference[ _]\d/i }

  # Remove probable filename extensions, e.g. qt03n8h3g9:
  #   01_intro_pages_16.doc.pdf       #1,0,796
  #   02_Chapter1_19.doc.pdf  #17,0,796
  #   03_Chapter2_24.doc.pdf  #36,0,796
  #   04_Chapter3_28.doc.pdf  #60,0,796
  #   05_Chapter4_33.doc.pdf  #89,0,796
  #   06_Chapter5_23.doc.pdf  #122,0,796
  #   07_Chapter6_6.doc.pdf   #149,0,796
  #   08_Chapter7.doc.pdf     #158,0,796
  #   09_References_12.doc.pdf        #165,0,796
  divs.each { |div| div[:title].sub!(/(\.\w{3,4}){1,2}$/, '') }

  # Remove very short lines
  divs.reject! { |div| div[:title].length < 4 }

  # If there's a single starting level-0 div, remove it. e.g. t0353w3wm:
  #    Prognostic Significance of the^MNon–Size-Based AJCC T2 Descriptors      #1,0,684
  #            Materials and Methods   #2,0,590
  #            Results #3,0,539
  #            Discussion      #5,0,487
  #            References      #7,0,319
  if divs.length > 4 && divs[0][:level] == 0 && divs[1..-1].map{|div| div[:level]}.min > 0
    divs.shift
  end

  # If the top level has too few entries, try second level
  if divs.select{ |div| div[:level] == 0 }.length >= 4
    divs = divs.select{ |div| div[:level] == 0 }
  elsif divs.select{ |div| div[:level] <= 1 }.length >= 4
    divs = divs.select{ |div| div[:level] <= 1 }
  else
    divs = divs.select{ |div| div[:level] <= 2 }
  end

  # The divs should be fairly different, e.g. the following (from qt2nw4p6dt) is bad:
  #   Arens2007-Assessment-of indoor-environments-Keynote, Roomvent-2007 WITH FOOTERS-1       #1,0,796
  #   Arens2007-Assessment-of indoor-environments-Keynote, Roomvent-2007 WITH FOOTERS-2       #2,0,796
  #   Arens2007-Assessment-of indoor-environments-Keynote, Roomvent-2007 WITH FOOTERS-3       #3,0,796
  #   Arens2007-Assessment-of indoor-environments-Keynote, Roomvent-2007 WITH FOOTERS-4       #4,0,796
  #   Arens2007-Assessment-of indoor-environments-Keynote, Roomvent-2007 WITH FOOTERS-5       #5,0,796
  #   ...
  reasons = []
  totalSame = 0
  (0..(divs.length-2)).each { |idx|
    thisTitle = divs[idx][:title].gsub(/(chapter|appendix|table|figure|section)[\s_]+/i,'')   # "chapter 1", "chapter 2" etc ok
    nextTitle = divs[idx+1][:title].gsub(/(chapter|appendix|table|figure|section)[\s_]+/i,'')
    lcs = longest_common_substring(thisTitle, nextTitle)
    totalSame += lcs.length / (thisTitle.length + 0.001)
  }
  avgSame = totalSame / (divs.length-1 + 0.001)
  avgSame > 0.6 and reasons << "Entries are too uniform (avgSame=#{(avgSame * 100).round(1)}%)"

  # Some things are too wordy to be a real TOC, e.g. qt03h468n4:
  #   Young adults encounter a wide array of hardships that provide significant developmental challenges and opportunities (Arnett, 2000; Collins & van Dulmen, 2006; Vollrath, 2000). In a nationally representative study in the United States, young adults r...   #10,105,619
  #   Fortunately, research on the social contexts of coping is thriving (Lakey & Orehek 2011; Mikulincer & Shaver, 2009; Thoits, 2011). Empirical findings suggest that the type of social support offered, such as instrumental help or emotional reassurance,...   #10,105,343
  #   The more we understand particular sources of social support for young adults, the more it becomes important to understand the processes that connect the sources. One issue that has recently attracted the field’s attention concerns the fit between the...   #11,105,702
  totalWords = 0
  divs.each { |div| totalWords += div[:title].split(/\s+/).length }
  avgWords = totalWords / (divs.length + 0.001)
  avgWords > 10 and reasons << "Entries are too wordy (avgWords=#{avgWords.round(1)})"

  # Make sure we ended up with something interesting.
  divs.length < 4 and reasons << "Not enough entries (#{divs.length})"
  divs.length > 40 and reasons << "Too many entries (#{divs.length})"

  if !reasons.empty?
    #puts "Warning: Unusable TOC (#{reasons.join("; ")})"
  else
    #puts "Usable TOC. avgWords=#{avgWords.round(1)} avgSame=#{(avgSame * 100).round(1)}%"
  end

  # Don't output the 'level' in the final data
  divs.each{ |div| div.delete(:level) }
  #puts "Divs (count=#{divs.length} avgWords=#{avgWords.round(1)} avgSame=#{(avgSame * 100).round(1)}%):"; pp divs
  return reasons.empty? ? divs : nil

end

###################################################################################################
def generateHtmlTOC(itemID)
  htmlPath = arkToFile(itemID, "content/base.html")
  File.exist?(htmlPath) or return nil
  htmlDoc = Nokogiri::HTML(File.open(htmlPath), &:noblanks)
  divs = []
  prev = nil
  htmlDoc.traverse { |node|
    if node.name =~ /^h(\d)/ && prev && prev.name == "a" && prev[:name]
      div = { level: $1.to_i,
              title: node.inner_html.gsub(%r{<[^>]+>}, ''),
              anchor: prev[:name] }
      divs << div
    elsif node.name =~ /^text|font|b|i|em|style$/
      next
    end
    prev = node
  }
  minLevel = divs.map{ |div| div[:level] }.min
  divs.each { |div| div[:level] -= (minLevel-1) }

  #puts "raw divs:"; pp divs
  divs = filterTOCDivs(divs)
  #puts "final divs:"; pp divs; puts
  return divs ? { source: 'html', divs: divs } : nil
end

###################################################################################################
def generatePdfTOC(itemID)
  begin
    pdfPath = arkToFile(itemID, "content/base.pdf")
    File.exist?(pdfPath) or return nil

    # The 'mutool' command from mupdf does a nice job of extracting the 'outline' (TOC) of a PDF
    outline = checkOutput(['/apps/eschol/bin/mutool', 'show', pdfPath, 'outline'], false).split("\n")
    outline.empty? and return nil

    # Combine split lines, and parse the results
    divs = []
    buf = ""
    outline.each { |line|
      # handle garbled 2, 3 and 4-byte UTF-8 strings 'courtesty' of mutools ( see story 172061580 and https://bugs.ghostscript.com/show_bug.cgi?id=702358 )
      # example garbled text: Declaraci\xC3\xB3n del artista
      # the regex below matches the following text in the example garbled text: \xC3\xB3
      # the following line converts each match back into the original single UTF-8 character
      line.gsub!(/\\x[CDEF][0-9A-F](\\x[89AB][0-9A-F])+/) { |m|
        m.to_s.scan(/[0-9A-Z]+/).map { |hex| hex.to_i(16) }.pack("c*").force_encoding('UTF-8') }
      if line =~ /\t#/
        (buf+line) =~ /^[^\t]?(\t*)"([^\t]*)"\t#(\d+)/ or raise("can't parse TOC line: #{line.inspect}")
        divs << { level: $1.length, title: $2.strip, anchor: "page=#{$3.to_i}" }
        buf = ""
      elsif line =~ /\(null\)/
        buf = ""
      else
        buf += line
      end
    }

    divs = filterTOCDivs(divs)
    return divs ? { source: 'mutool', divs: divs } : nil

  rescue Exception => e
    puts "Warning: error generating toc: #{e}: #{e.backtrace.join("; ")}"
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

def addShowPubDatesAttrs(issueUnit, volNum, issueNum, issueAttrs)
  iss = Issue.where(unit_id: issueUnit, volume: volNum, issue: issueNum).first
  if iss
    issAttrs = (iss.attrs && JSON.parse(iss.attrs)) || {}
    show_pub_dates = issAttrs["show_pub_dates"]
  else
    unit = $allUnits[issueUnit]
    unitAttrs = unit && unit.attrs && JSON.parse(unit.attrs) || {}
    if unitAttrs["default_issue"] && unitAttrs["default_issue"]["show_pub_dates"]
        show_pub_dates = unitAttrs["default_issue"]["show_pub_dates"]
    else
      iss = Issue.where(unit_id: issueUnit).order(Sequel.desc(:published)).order_append(Sequel.desc(:issue)).first
      if iss
        issAttrs = (iss.attrs && JSON.parse(iss.attrs)) || {}
        show_pub_dates = issAttrs["show_pub_dates"]
      end
    end
    issueAttrs[:show_pub_dates] = show_pub_dates
  end
end

###################################################################################################
def grabUCISupps(rawMeta)
  # For UCIngest format, read supp data from the raw metadata file.
  supps = []
  rawMeta.xpath("//content/supplemental/file").each { |fileEl|
    # First regex below normalizes old filenames that used to start with "content/supp".
    # Second regex below gets rid of URL query parameters that come from the old OJS converter,
    # e.g. "?origin=ojsimport"
    suppAttrs = { file: fileEl[:path].sub(%r{.*content/supp/}, "").sub(%r{\?.*$}, "") }
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
    suppPath = tryMainAndSequester(arkToFile(itemID, "content/supp/#{supp[:file]}"))
    if !suppPath
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
    when "cc1"; "https://creativecommons.org/licenses/by/4.0/"
    when "cc2"; "https://creativecommons.org/licenses/by-sa/4.0/"
    when "cc3"; "https://creativecommons.org/licenses/by-nd/4.0/"
    when "cc4"; "https://creativecommons.org/licenses/by-nc/4.0/"
    when "cc5"; "https://creativecommons.org/licenses/by-nc-sa/4.0/"
    when "cc6"; "https://creativecommons.org/licenses/by-nc-nd/4.0/"
    when nil, "public"; nil
    else puts "Unknown rights value #{oldRights.inspect}"; nil
  end
end

###################################################################################################
def rightsURLToCode(rights)
  rights.nil? and return ""
  rights =~ %r{^https://creativecommons.org/licenses/(by|by-nc|by-nc-nd|by-nc-sa|by-nd|by-sa)/(\d.\d)/$} or raise
  kind, ver = $1, $2
  return "CC #{kind.upcase}"  # e.g. "CC BY-NC"
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
    suppSize = File.size(tryMainAndSequester(arkToFile(itemID, "content/supp/#{suppName}"))) or raise
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
def tryMainAndSequester(path)
  File.exist?(path) and return path
  path = path.sub("erep/data/", "erep/data_sequester/")
  File.exist?(path) and return path
  return nil
end

###################################################################################################
def parseUCIngest(itemID, inMeta, fileType, isPending)
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
  attrs[:pub_submit] = parseDate(inMeta.text_at("./context/dateSubmitted"))
  attrs[:pub_accept] = parseDate(inMeta.text_at("./context/dateAccepted"))
  attrs[:pub_publish] = parseDate(inMeta.text_at("./context/datePublished"))

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
  if inMeta[:state] != "withdrawn" && issueNum && volNum
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
        addShowPubDatesAttrs(issueUnit, volNum, issueNum, issueAttrs)
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
      exAtts.reject! { |_k, v| !v }
      exAtts.empty? or attrs[:ext_journal] = exAtts
    end
  end

  # Generate thumbnails and TOCs (but only for non-suppressed PDF items).
  # But in pre-index mode don't do the thumbnail step because sometimes it takes a long time, and
  # pre-index needs to happen quickly so the API can return.
  if !attrs[:suppress_content] && File.exist?(arkToFile(itemID, "content/base.pdf"))
    if !$preindexMode && !isPending
      attrs[:thumbnail] = generatePdfThumbnail(itemID, inMeta, Item[itemID])
    end
    attrs[:toc] = parseCustomTOC(itemID) || generatePdfTOC(itemID)
  end

  # Remove empty attrs
  attrs.reject! { |_k, v| !v || (v.respond_to?(:empty?) && v.empty?) }

  # Detect HTML-formatted items
  contentFile = inMeta.at("/record/content/file[@path]")
  contentFile && contentFile.at("./native[@path]") and contentFile = contentFile.at("./native")
  contentType = contentFile && contentFile.at("./mimeType") && contentFile.at("./mimeType").text

  # Record name of native file, if any
  if contentFile && contentFile.name == "native" && contentFile[:path]
    nativePath = tryMainAndSequester(arkToFile(itemID, contentFile[:path].sub(/.*\//, 'content/')))
    if nativePath
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

  # Generate thumbnails and TOCs (but only for non-suppressed PDF items)
  if !attrs[:suppress_content] && !attrs[:toc] && contentType == "text/html" &&
                  File.exist?(arkToFile(itemID, "content/base.html"))
    attrs[:toc] = generateHtmlTOC(itemID)
  end

  # Populate the Item model instance
  dbItem = Item.new
  dbItem[:id]           = itemID
  dbItem[:source]       = inMeta.text_at("./source") || "unknown"
  dbItem[:status]       = isPending ? "pending" :
                          isJunk ? "withdrawn-junk" :
                          attrs[:withdrawn_date] ? "withdrawn" :
                          isEmbargoed(attrs[:embargo_date]) ? "embargoed" :
                          (attrs[:suppress_content] && inMeta[:state] == "published") ? "empty" :
                          (inMeta[:state] || raise("no state in record"))
  dbItem[:title]        = sanitizeHTML(inMeta.html_at("./title"))
  dbItem[:content_type] = attrs[:suppress_content] ? nil :
                          attrs[:withdrawn_date] ? nil :
                          isEmbargoed(attrs[:embargo_date]) ? nil :
                          pdfExists ? "application/pdf" :  # consider before non-textual, in case PDF was supplied by Elements
                          inMeta[:type] == "non-textual" ? nil :
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
def processWithNormalizer(fileType, itemID, metaPath, nailgun, isPending)
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
  return parseUCIngest(itemID, normXML.root, fileType, isPending)
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
  r = (r[0].match(/[^\w]/)) ? r[1..-1].strip : r
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
def reformatXML(path)
  return File.exist?(path) ? fileToXML(path).to_xml(indent: 3) : nil
end

###################################################################################################
def collectArchiveMeta(itemID, rawMetaXML)
  return ArchiveMeta.new { |record|
    record[:item_id] = itemID
    record[:meta] = rawMetaXML || reformatXML(arkToFile(itemID, "meta/base.meta.xml"))
    record[:feed] = reformatXML(arkToFile(itemID, "meta/base.feed.xml"))
    record[:cookie] = reformatXML(arkToFile(itemID, "meta/base.cookie.xml"))
    record[:history] = reformatXML(arkToFile(itemID, "meta/base.history.xml"))
  }
end

###################################################################################################
# Extract metadata for an item, and add it to the current index batch.
# Note that we create, but don't yet add, records to our database. We put off really inserting
# into the database until the batch has been successfully processed by AWS.
def indexItem(itemID, batch, nailgun)

  # Grab the main metadata file
  metaPath = arkToFile(itemID, "meta/base.meta.xml")
  if !File.exist?(metaPath) || File.size(metaPath) < 50
    puts "Warning: skipping #{itemID} due to missing or truncated meta.xml"
    $nSkipped += 1
    return
  end
  rawMeta = fileToXML(metaPath)
  rawMetaXML = rawMeta.to_xml(indent: 3)
  rawMeta.remove_namespaces!
  rawMeta = rawMeta.root

  isPending = metaPath.include?("/next/")

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
      processWithNormalizer(normalize, itemID, metaPath, nailgun, isPending)
  else
    dbItem, attrs, authors, contribs, units, issue, section, suppSummaryTypes =
      parseUCIngest(itemID, rawMeta, "UCIngest", isPending)
  end

  text = $noCloudSearchMode ? "" : grabText(itemID, dbItem.content_type)
  
  # Create JSON for the full text index
  authsAndContribs = authors.map { |auth| auth[:name][0,1024] } + contribs.map { |c| c[:name][0,1024] }
  idxItem = {
    type:          "add",   # in CloudSearch land this means "add or update"
    id:            itemID,
    fields: {
      title:         dbItem[:title] ? cleanTitle(dbItem[:title]) : "",
      authors:       authsAndContribs.length > 1000 ? authsAndContribs[0,1000] : authsAndContribs,
      abstract:      attrs[:abstract] || "",
      type_of_work:  dbItem[:genre],
      disciplines:   attrs[:disciplines] ? attrs[:disciplines] : [""], # only the numeric parts
      peer_reviewed: attrs[:is_peer_reviewed] ? 1 : 0,
      pub_date:      dbItem[:published].to_date.iso8601 + "T00:00:00Z",
      pub_year:      dbItem[:published].year,
      rights:        rightsURLToCode(dbItem[:rights]),
      sort_author:   (authors[0] || {name:""})[:name].gsub(/[^\w ]/, '')[0,1024].downcase,
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

  # Make sure withdrawn items get deleted from the index. Also make sure pending items
  # aren't in the index.
  if attrs[:suppress_content] || dbItem[:status] == "pending"
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
  dbContribs = contribs.each_with_index.map { |data, _idx|
    ItemContrib.new { |contrib|
      contrib[:item_id] = itemID
      contrib[:role] = data[:role]
      data.delete(:role)
      contrib[:attrs] = JSON.generate(data)
      contrib[:ordering] = (roleCounts[contrib[:role]] += 1)
    }
  }

  # For convenient spelunking, record the archival metadata in the db
  dbArchiveMeta = collectArchiveMeta(itemID, rawMetaXML)

  # Calculate digests of the index data and database records
  idxData = JSON.generate(idxItem)
  idxDigest = Digest::MD5.base64digest(idxData)
  dbCombined = {
    dbItem: dbItem.to_hash,
    dbAuthors: dbAuthors.map { |authRecord| authRecord.to_hash },
    dbIssue: issue ? issue.to_hash : nil,
    dbSection: section ? section.to_hash : nil,
    units: units,
    archiveMeta: dbArchiveMeta.to_hash
  }
  dbContribs.empty? or dbCombined[:dbContribs] = dbContribs.map { |record| record.to_hash }
  dataDigest = Digest::MD5.base64digest(JSON.generate(dbCombined))

  # Add time-varying things into the database item now that we've generated a stable digest.
  timestamp = $preindexMode ? nil : DateTime.now
  dbItem[:last_indexed] = timestamp
  dbItem[:index_digest] = $noCloudSearchMode ? (existingItem && existingItem[:index_digest]) : idxDigest
  dbItem[:data_digest] = dataDigest

  dbDataBlock = { dbItem: dbItem, dbAuthors: dbAuthors, dbContribs: dbContribs,
                  dbIssue: issue, dbSection: section, units: units,
                  dbArchiveMeta: dbArchiveMeta }

  # Single-item debug
  if $testMode
    fooData = dbCombined.clone
    fooData.delete(:archiveMeta)
    pp fooData
    fooData = idxItem.clone
    fooData[:fields] and fooData[:fields][:text] and fooData[:fields].delete(:text)
    pp fooData
    exit 1
  end

  # If nothing has changed, skip the work of updating this record.
  if existingItem && !$forceMode && ($preindexMode || existingItem[:index_digest] == idxDigest)

    # If only the database portion changed, we can safely skip the CloudSearch re-indxing
    if existingItem[:data_digest] != dataDigest
      puts "#{$forceMode ? "Forced" : "Changed"} item. (database change only, search data unchanged)"
      $dbMutex.synchronize {
        DB.transaction { updateDbItem(dbDataBlock) }
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

  puts "#{existingItem ? ($forceMode ? 'Forced' : 'Changed') : 'New'} item.#{attrs[:suppress_content] ? " (suppressed content)" : ""}"

  if $noCloudSearchMode
    $dbMutex.synchronize {
      DB.transaction { updateDbItem(dbDataBlock) }
    }
    $nProcessed += 1
    return
  end

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
        itemID = $indexQueue.pop
        itemID or break

        # Extract data and index it (in batches)
        begin
          Thread.current[:name] = "index thread: #{itemID}"  # label all stdout from this thread
          indexItem(itemID, batch, nailgun)
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
    if $preindexMode
      raise e
    else
      puts "Exception in indexAllItems: #{e} #{e.backtrace}"
    end
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
  if !$preindexMode
    # Remove orphaned sections and issues (can happen when items change)
    $dbMutex.synchronize {
      DB.run("delete from sections where id not in (select distinct section from items where section is not null)")
      DB.run("delete from issues where id not in (select distinct issue_id from sections where issue_id is not null)")
    }
  end
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
  # MH 2020-05-18: disabling archive meta for now; it was taking a fair amount of time.
  # I'm trying to get the conversion queue to drain quickly.
  ##data[:dbArchiveMeta].create_or_update()

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

  # Finish the data buffer, and send to AWS. Note that in $noCloudSearchMode, we shouldn't have
  # any batch data anyway, since the digest logic above reverts to the old digest.
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

  scrubSectionsAndIssues()

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
           'erc.who'  => "#{normalizeERC(name)}",
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
      #if emailToPerson.key?(email) && emailToPerson[email] != person.id
      #  puts "Warning: multiple matching people for email #{email.inspect}"
      #end
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
# Fix duplicate 'people' records created by race condition.
def fixDupePeople
  puts "Scanning for unconnected authors."
  connectAuthors  # make sure all newly converted (or reconverted) items have author->people links

  puts "Scanning for referenced people."
  referencedPeople = Set.new
  ItemAuthor.where(Sequel.lit("person_id is not null")).each { |row|
    row[:person_id] and referencedPeople << row[:person_id]
  }

  puts "Scanning for duplicate people."
  emailToPeople = Hash.new { |h,k| h[k] = Set.new }
  Person.where(Sequel.lit("attrs->'$.email' is not null")).each { |person|
    attrs = JSON.parse(person.attrs)
    next if attrs['forwarded_to']
    Set.new([attrs['email']] + (attrs['prev_emails'] || [])).each { |email|
      emailToPeople[email.downcase] << person.id
    }
  }

  puts "Change phase starting."
  DB.transaction {
    emailToPeople.each { |email, people|
      next if people.size == 1

      keep = people & referencedPeople
      keep.empty? and keep << people.to_a.sort[0]

      toss = people - keep
      if !toss.empty?
        puts "#{email}: keep=#{keep.to_a.join(";")} toss=#{toss.to_a.join(";")}"
        toss.each { |id| Person[id].delete }
      end

      if keep.size > 1
        sorted = keep.to_a.sort
        target = sorted[0]
        remap = sorted[1..-1]
        puts "#{email}: target=#{target} remap=#{remap.join(";")}"
        remap.each { |source|
          ItemAuthor.where(person_id: source).update(person_id: target)
        }
      end
    }
  }
end

###################################################################################################
# Main driver for item conversion
def convertAllItems(arks)
  # Let the user know what we're doing
  puts "Converting #{arks=="ALL" ? "all" : "selected"} items."

  cacheAllUnits()

  # Fire up threads for doing the work in parallel
  Thread.abort_on_exception = true
  indexThread = Thread.new { indexAllItems }
  batchThread = Thread.new { processAllBatches }

  arks.each { |ark|
    ark =~ /^qt\w{8}$/ or raise("Invalid ark #{ark.inspect}")
    $indexQueue << ark
  }
  $indexQueue << nil  # end-of-queue

  # Wait for everything to work its way through the queues.
  indexThread.join
  batchThread.join

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
def flushDbQueue(queue)
  DB.transaction { queue.each { |func| func.call } }
  queue.clear
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
# One-time pass to re-populate the archive_meta table after stopped updates to it
def fixArchiveMeta
  nDone = 0
  allIDs = Item.where(Sequel.lit("updated >= '2020-05-18'")).select_map(:id)
  allIDs.sort.each_slice(100) { |ids|
    DB.transaction {
      ids.each { |itemID| collectArchiveMeta(itemID, nil).save }
    }
    nDone += ids.length
    puts "#{nDone}/#{allIDs.length} done."
  }
end

###################################################################################################
# Main action begins here

startTime = Time.now
arks = Set.new(ARGV.select { |a| a =~ /qt\w{8}/ })

# Pre-index mode: no locking, just update database for one item and get out
if ARGV.delete("--preindex")
  arks.empty? and raise("Must specify item(s) to convert.")
  $preindexMode = $noCloudSearchMode = true
  convertAllItems(arks)
  exit 0
end

case ARGV[0]
  when "--items"
    arks.empty? and raise("Must specify item(s) to convert.")
    convertAllItems(arks)
  when "--info"
    indexInfo()
  when "--genAllStruct"
    # run periodically to make sure old eschol4 things work properly
    cacheAllUnits
    genAllStruct
  when "--connectAuthors"
    # run periodically to make sure all newly converted (or reconverted) items have author->people links
    # (needed for author stats to work)
    connectAuthors
  when "--fixArchiveMeta"
    # run once to fix out-of-date meta; will be kept up to date after this.
    fixArchiveMeta
  else
    STDERR.puts "Usage: #{__FILE__} {--items arks...|--info|--genAllStruct} [--preindex] [--test] [--force] [--noCloudSearch]"
    exit 1
end

puts "Elapsed: #{Time.now - startTime} sec."
puts "Conversion complete."
