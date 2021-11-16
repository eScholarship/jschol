#!/usr/bin/env ruby

# This script generates linearized versions of a PDF, with and without a splash page.

# Run from the right directory (the parent of the splash dir)
Dir.chdir(File.dirname(File.expand_path(File.dirname(__FILE__))))

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# System gems
require 'aws-sdk-s3'
require 'digest'
require 'httparty'
require 'json'
require 'nokogiri'
require 'pathname'
require 'open3'
require 'sequel'
require 'tempfile'

# Local dependencies
require_relative '../util/sanitize.rb'

# Mode to override up-to-date test
$forceMode = ARGV.delete('--force')

DATA_DIR = "/apps/eschol/erep/data"

TEMP_DIR = "/apps/eschol/eschol5/jschol/tmp"
FileUtils.mkdir_p(TEMP_DIR)

SPLASH_MAX_TEXT = 250
SPLASH_MAX_AUTHORS = 3

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

require_relative '../tools/models.rb'

# S3 API client
# Note: we use InstanceProfileCredentials here to avoid picking up ancient
#       credentials file pub-submit-prd:~/.aws/config
$s3Client = Aws::S3::Client.new(credentials: Aws::InstanceProfileCredentials.new,
                                region: getEnv("S3_REGION"))
$s3Bucket = Aws::S3::Bucket.new(getEnv("S3_BUCKET"), client: $s3Client)

# Get hash of all active root level campuses/ORUs, sorted by ordering in unit_hier table
def getActiveCampuses
  return Unit.join(:unit_hier, :unit_id=>:id).
           filter(:ancestor_unit=>'root', :is_direct=>1).exclude(:status=>["hidden", "archived"]).
           order_by(:ordering).to_hash(:id)
end

$activeCampuses = getActiveCampuses
$hostname = `/bin/hostname`.strip
$cclicense = {
  'by' => 'Attribution',
  'by-nc' => 'Attribution-NonCommercial',
  'by-nd' => 'Attribution-NoDerivatives',
  'by-nc-nd' => 'Attribution-NonCommercial-NoDerivatives',
  'by-sa' => 'Attribution-ShareAlike',
  'by-nc-sa' => 'Attribution-NonCommercial-ShareAlike'
}
###################################################################################################
def getShortArk(arkStr)
  arkStr =~ %r{^ark:/?13030/(qt\w{8})$} and return $1
  arkStr =~ /^(qt\w{8})$/ and return arkStr
  arkStr =~ /^\w{8}$/ and return "qt#{arkStr}"
  raise("Can't parse ark from #{arkStr.inspect}")
end

###################################################################################################
def arkToFile(ark, subpath, root = DATA_DIR)
  shortArk = getShortArk(ark)
  path = "#{root}/13030/pairtree_root/#{shortArk.scan(/\w\w/).join('/')}/#{shortArk}/#{subpath}"
  return path.sub(%r{^/13030}, "13030").gsub(%r{//+}, "/").gsub(/\bbase\b/, shortArk).sub(%r{/+$}, "")
end

###################################################################################################
def countPages(pdfPath)
  stdout, stderr, status = Open3.capture3("/apps/eschol/bin/qpdf --show-npages #{pdfPath}")
  if stdout.strip =~ /^\d+$/
    return stdout.to_i
  else
    puts "Warning: error trying to count pages of #{pdfPath}: #{stderr.inspect}"
    return nil
  end
end

###################################################################################################
def travAndFormat(data, out)
  if data.text?
    text = data.to_s
    return if text.nil? || text.empty?  # but do not strip - space at beg or end can be significant
    if out[:textSize] + text.length > SPLASH_MAX_TEXT
      # Truncate long titles
      toAdd = SPLASH_MAX_TEXT - out[:textSize]
      return if toAdd == 0
      text = text[0, toAdd].strip
      out[:truncated] = true
    end
    out[:textSize] += text.length
    if out[:attrs].empty?
      out[:chunks] << text
    else
      tmp = out[:attrs].clone
      tmp[:str] = text
      out[:chunks] << tmp
    end
  elsif data.element?
    prevAttrs = out[:attrs]
    out[:attrs] = out[:attrs].clone
    case data.name.downcase
      when "sup";         out[:attrs][:sup] = true
      when "sub";         out[:attrs][:sub] = true
      when "b", "strong"; out[:attrs][:bold] = true
      when "i", "em";     out[:attrs][:italic] = true
    end
    data.children.each { |sub|
      travAndFormat(sub, out)
    }
    out[:attrs] = prevAttrs
  else
    raise "Unknown type in trav: #{data.inspect}"
  end
end

###################################################################################################
def formatText(htmlStr)
  data = Nokogiri::HTML(sanitizeHTML(htmlStr)) do |config|
    config.noblanks.nodtdload
  end
  out = { textSize:0, trucated: false, attrs: {}, chunks:[] }
  travAndFormat(data.root, out)
  if out[:truncated]
    out[:chunks] << "..."
  end
  return out[:chunks]
end

###################################################################################################
# Parses and formats data availability statement. Returns [text, (link)]
def getDataAvail(itemAttrs)
  ds = itemAttrs["data_avail_stmnt"] or return nil
  case ds["type"]
    when "publicRepo"
      return "The data associated with this publication are available at: ", ds["url"]
    when "publicRepoLater"
      return "Associated data will be made available after this publication is published."
    when "suppFiles"
      return "The data associated with this publication are in the supplemental files."
    when "withinManuscript"
      return "The data associated with this publication are within the manuscript."
    when "onRequest"
      return "The data associated with this publication are available upon request."
    when "thirdParty"
      return "The data associated with this publication are managed by: #{ds["contact"]}"
    when "notAvail"
      return "The data associated with this publication are not available for this reason: #{ds["reason"]}"
    else
      raise "Unknown data_avail_stmnt type #{ds["type"].inspect}"
  end
end

###################################################################################################
def getCampusId(unit)
  r = UnitHier.where(unit_id: unit.id).where(ancestor_unit: $activeCampuses.keys).first
  return (unit.type=='campus') ? unit.id : r ? r.ancestor_unit : 'root'
end

###################################################################################################
def splashInstrucs(itemID, item, attrs)
  instruc = []

  # Primary unit
  unitIDs = UnitItem.where(:item_id => itemID, :is_direct => true).order(:ordering_of_units).select_map(:unit_id)
  unit = unitIDs ? Unit[unitIDs[0]] : nil
  campus = unit ? Unit[getCampusId(unit)] : nil
  instruc << { h1: { text: campus ? campus.name : "eScholarship" } }
  unit and instruc << { h2: { text: unit.name } }

  # Title
  if item.title
    instruc << { h3: { text: "Title" } } << { paragraph: { text: formatText(item.title) } }
  end

  # Permalink
  permalink = "https://escholarship.org/uc/item/#{itemID.sub(/^qt/,'')}"
  instruc << { h3: { text: "Permalink" } } << { paragraph: { link: { url: permalink, text: permalink } } }

  # Journal info
  journalText = nil
  issn = nil
  if item.section
    # eSchol journals
    sect = Section[item.section]
    issue = Issue[sect.issue_id]
    journal = Unit[issue.unit_id]
    journalText = journal.name
    if issue.volume
      journalText << ", #{issue.volume}"
      issue.issue and journalText << "(#{issue.issue})"
    end
    issn = JSON.parse(unit.attrs)["issn"]
  elsif (ext = attrs["ext_journal"]) && ext["name"]
    # External journals
    journalText = ext["name"]
    if ext["volume"]
      journalText << ", #{ext["volume"]}"
      ext["issue"] and journalText << "(#{ext["issue"]})"
    end
    issn = ext["issn"]
  end
  if journalText
    instruc << { h3: { text: "Journal" } } << { paragraph: { text: journalText } }
  end

  # ISSN / ISBN
  issn and instruc << { h3: { text: "ISSN" } } << { paragraph: { text: issn } }
  attrs["isbn"] and instruc << { h3: { text: "ISBN" } } << { paragraph: { text: attrs["isbn"] } }

  # Authors
  nAuthors = ItemAuthors.where(item_id: itemID).count
  if nAuthors > 0
    instruc << { h3: { text: "Author#{nAuthors > 1 ? 's' : ''}" } }
    ItemAuthors.where(item_id: itemID).limit(SPLASH_MAX_AUTHORS).each { |auth|
      authAttrs = JSON.parse(auth.attrs)
      authAttrs["name"] and instruc << { paragraph: { text: authAttrs["name"] } }
    }
    if nAuthors > SPLASH_MAX_AUTHORS
      instruc << { paragraph: { link: { url: "#{permalink}#author", text: "et al." } } }
    end
  end

  # Publication date
  pub_date = item.published.to_s =~ /^(\d\d\d\d)-01-01$/ ? $1 : item.published
  instruc << { h3: { text: "Publication Date" } } << { paragraph: { text: pub_date } }

  # DOI
  attrs["doi"] and instruc << { h3: { text: "DOI" } } << { paragraph: { text: attrs["doi"] } }

  # Supplemental material
  if attrs["supp_files"]
    link = "#{permalink}#supplemental"
    instruc << { h3: { text: "Supplemental Material" } } <<
               { paragraph: { link: { url: link, text: link } } }
  end

  # Data availability statement
  dsText, dsLink = getDataAvail(attrs)
  if dsText
    instruc << { h3: { text: "Data Availability" } }
    if dsLink
      instruc << { paragraph: [ { text: dsText }, { link: { url: dsLink, text: dsLink } } ] }
    else
      instruc << { paragraph: { text: dsText } }
    end
  end

  pub_year = item.published.to_s.match('\d\d\d\d')[0]
  # Copyright Information
  if item.rights
    m = item.rights.match(/^https:\/\/creativecommons.org\/licenses\/(by|by-nc|by-nc-nd|by-nc-sa|by-nd|by-sa)\/(\d\.\d)\/$/)
    if $cclicense.key?(m[1])
      ccType = $cclicense[m[1]]
    else
      ccType = m[1].upcase
    end
    ccYear = m[2]
  end

  if item.source == 'ojs'
    terms_link = 'https://escholarship.org/terms'
    instruc << { h3: { text: "Copyright Information" } }
    if item.rights
      instruc << { paragraph: [ { text: "Copyright #{pub_year} by the author(s).This work is made available under the terms of a Creative Commons #{ccType} License, available at " }, { link: { url: item.rights, text: item.rights } } ] }
    else
      instruc << { paragraph: [ { text: "Copyright #{pub_year} by the author(s). All rights reserved unless otherwise indicated. Contact the author(s) for any necessary permissions. Learn more at " }, { link: { url: terms_link, text: terms_link } } ] }
    end
  elsif item.rights
    instruc << { h3: { text: "Copyright Information" } }
    instruc << { paragraph: [ { text: "This work is made available under the terms of a Creative Commons #{ccType} License, availalbe at " }, { link: { url: item.rights, text: item.rights } } ] }
  end

  # Flags
  flagText = ""
  attrs["is_peer_reviewed"] and flagText << "#{flagText.empty? ? '' : '|'}Peer reviewed"
  attrs["is_undergrad"] and flagText << "#{flagText.empty? ? '' : '|'}Undergraduate"
  item.genre == "dissertation" and flagText << "#{flagText.empty? ? '' : '|'}Thesis/dissertation"
  flagText.empty? or instruc << { paragraph: { text: "\n#{flagText}" } }

  return instruc
end

###################################################################################################
def getRealPath(path)
  Pathname.new(path).realpath.to_s
end

###################################################################################################
def splashGen(itemID, instrucs, origFile, targetFile)
  splashTemp, combinedTemp, linearizedTemp = nil, nil, nil
  begin
    # Splash page generator is a Java servlet, since iText was the only open source library we
    # found that has all the capabilities we need (especially preserving tagged content). So call
    # out to it as a web service.
    splashTemp = Tempfile.new(["splash_#{itemID}_", ".pdf"], TEMP_DIR)
    combinedTemp = Tempfile.new(["combined_#{itemID}_", ".pdf"], TEMP_DIR)
    data = { pdfFile: getRealPath(origFile),
             splashFile: getRealPath(splashTemp.path),
             combinedFile: getRealPath(combinedTemp.path),
             instrucs: instrucs }
    #puts "Sending splash data: #{data.to_json.encode("UTF-8")}"
    url = "http://#{$hostname}.escholarship.org:18881/splash/splashGen"
    response = HTTParty.post(url, body: data.to_json.encode("UTF-8"))
    response.success? or raise("Error #{response.code} generating splash page: #{response.message}")

    # Linearize the result for fast display of the first page on all platforms.
    linFix = true
    if linFix
      # A strange bug on Chrome 63+ causes the first page of our linearized PDFs to render as
      # gibberish. Found by experimentation that running the combined file through pdftk before
      # linearizing works around the problem, for reasons unknown.
      # See https://www.pivotaltracker.com/story/show/161164221
      # and https://bugs.chromium.org/p/chromium/issues/detail?id=711984
      fixTemp = Tempfile.new(["fixed_#{itemID}_", ".pdf"], TEMP_DIR)
      system("/apps/eschol/bin/pdftk #{combinedTemp.path} output #{fixTemp.path}")
      code = $?.exitstatus
      code == 0 || code == 3 or raise("Error #{code} fixing.")

      system("/apps/eschol/bin/qpdf --linearize #{fixTemp.path} #{targetFile}")
      code = $?.exitstatus
      code == 0 || code == 3 or raise("Error #{code} linearizing.")
    else
      system("/apps/eschol/bin/qpdf --linearize #{combinedTemp.path} #{targetFile}")
      code = $?.exitstatus
      code == 0 || code == 3 or raise("Error #{code} linearizing.")
    end

    # Sanity checking
    origPageCt = countPages(getRealPath(origFile))
    splashPageCt = countPages(targetFile)
    if splashPageCt != origPageCt+1
      puts "Warning: splash version of #{itemID} is #{splashPageCt} pages, " +
           "but should be #{origPageCt}+1 = #{origPageCt+1}. Suppressing splash version."
      return 0
    end

    # Return the size of the resulting PDF
    return File.size(targetFile)
  ensure
    splashTemp and splashTemp.unlink
    combinedTemp and combinedTemp.unlink
  end
end

###################################################################################################
def calcSha256(path)
  return Digest::SHA256.file(path).hexdigest
end

###################################################################################################
def calcNoSplashKey(itemID)
  return Digest::MD5.hexdigest("noSplash:#{getEnv('JSCHOL_KEY')}|#{itemID}")
end

###################################################################################################
def copyContentFile(itemID, oldObj, newObj)
  tmpFile = nil
  begin
    tmpFile = Tempfile.new(["patch_#{itemID}_", ".pdf"], TEMP_DIR)
    oldObj.get(response_target: tmpFile.path)
    newObj.upload_file(tmpFile.path, { metadata: { sha256: calcSha256(tmpFile.path) },
                                       content_type: "application/pdf",
                                       storage_class: "INTELLIGENT_TIERING" })
  ensure
    tmpFile and tmpFile.unlink
  end
end


###################################################################################################
# Move pending PDF files to their published location
def movePendingFiles(itemID)
  noSplashKey = calcNoSplashKey(itemID)

  pvwPfx = getEnv("S3_PREVIEW_PREFIX")
  pvwLin = $s3Bucket.object("#{pvwPfx}/#{itemID}/#{itemID}_noSplash_#{noSplashKey}.pdf")
  pvwSplash = $s3Bucket.object("#{pvwPfx}/#{itemID}/#{itemID}.pdf")

  # If there's no preview file to move, we have nothing to do
  pvwLin.exists? or return

  # Move the preview splash file, if present
  contentPfx = getEnv("S3_CONTENT_PREFIX")
  if pvwSplash.exists?
    newSplash = $s3Bucket.object("#{contentPfx}/#{itemID}/#{itemID}.pdf")
    puts "  movePending: copying #{pvwSplash.key} to #{newSplash.key}"
    copyContentFile(itemID, pvwSplash, newSplash)
    pvwSplash.delete
  end

  # Move the linearized file
  newLin = $s3Bucket.object("#{contentPfx}/#{itemID}/#{itemID}_noSplash_#{noSplashKey}.pdf")
  puts "  movePending: copying #{pvwLin.key} to #{newLin.key}"
  copyContentFile(itemID, pvwLin, newLin)
  pvwLin.delete
end

###################################################################################################
# Delete files for withdrawn item
def deleteContentFiles(itemID)
  noSplashKey = calcNoSplashKey(itemID)

  # Remove the preview files if present
  pvwPfx = getEnv("S3_PREVIEW_PREFIX")
  pvwLin = $s3Bucket.object("#{pvwPfx}/#{itemID}/#{itemID}_noSplash_#{noSplashKey}.pdf")
  pvwLin.exists? and pvwLin.delete
  pvwSplash = $s3Bucket.object("#{pvwPfx}/#{itemID}/#{itemID}.pdf")
  pvwSplash.exists? and pvwSplash.delete

  # Remove the published files if present
  contentPfx = getEnv("S3_CONTENT_PREFIX")
  newSplash = $s3Bucket.object("#{contentPfx}/#{itemID}/#{itemID}.pdf")
  newSplash.exists? and newSplash.delete
  newLin = $s3Bucket.object("#{contentPfx}/#{itemID}/#{itemID}_noSplash_#{noSplashKey}.pdf")
  newLin.exists? and newLin.delete
end

###################################################################################################
# Main driver for PDF display version generation
def convertPDF(itemID)
  item = Item[itemID]
  isPending = Item[itemID].status == "pending"
  contentPfx = getEnv(isPending ? "S3_PREVIEW_PREFIX" : "S3_CONTENT_PREFIX")

  # Skip non-published items (e.g. embargoed, withdrawn)
  if !item || !%w{published pending}.include?(item.status)
    puts "  Not generating splash for #{item.status} item."
    DisplayPDF.where(item_id: itemID).delete  # delete splash pages when item gets withdrawn
    deleteContentFiles(itemID)
    return
  end

  # If item is transitioning from pending to published, move the old files.
  !isPending and movePendingFiles(itemID)

  # Generate the splash instructions, for cache checking
  attrs = JSON.parse(item.attrs)
  instrucs = splashInstrucs(itemID, item, attrs)
  instrucDigest = Digest::MD5.base64digest(instrucs.to_json)

  # See if current splash page is adequate
  if File.exist?(arkToFile(itemID, "meta/base.meta.xml"))
    origFile = arkToFile(itemID, "content/base.pdf")
  else
    origFile = arkToFile(itemID, "next/content/base.pdf")
  end
  if !File.exist?(origFile)
    puts "  Missing content file; skipping splash."
    return
  end
  origSize = File.size(origFile)
  origTimestamp = File.mtime(origFile)

  contentPfx = getEnv(isPending ? "S3_PREVIEW_PREFIX" : "S3_CONTENT_PREFIX")

  dbPdf = DisplayPDF[itemID]
  # It's odd, but comparing timestamps by value isn't reliable. Converting them to strings is though.
  if !$forceMode && dbPdf &&
       dbPdf.orig_size == origSize &&
       dbPdf.orig_timestamp.to_s == origTimestamp.to_s &&
       dbPdf.splash_info_digest == instrucDigest
    puts "  Original unchanged; retaining existing splash version."
    #copyPatches(itemID, contentPfx)  # FIXME - remove this when s3 transition is complete
    return
  end
  puts "  Updating splash."

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
      if e.to_s =~ /Internal Server Error|Error 500/
        puts "  Warning: splash generator failed; falling back to plain."
      else
        raise
      end
    end


    # New S3 location
    # Note 2019-02-24: It's important to use TempFile.path here - otherwise Ruby S3 SDK is ridiculously slow.
    # See https://stackoverflow.com/questions/48930354/awss3-put-object-very-slow-with-aws-sdk-ruby
    $s3Bucket.object("#{contentPfx}/#{itemID}/#{itemID}_noSplash_#{calcNoSplashKey(itemID)}.pdf").
      upload_file(linFile.path, { metadata: { sha256: calcSha256(linFile) },
                                  content_type: "application/pdf",
                                  storage_class: "INTELLIGENT_TIERING" })

    mainFile = splashLinSize > 0 ? splashLinFile : linFile
    $s3Bucket.object("#{contentPfx}/#{itemID}/#{itemID}.pdf").
      upload_file(mainFile.path, { metadata: { sha256: calcSha256(mainFile) },
                                   content_type: "application/pdf",
                                   storage_class: "INTELLIGENT_TIERING" })

    # Update the database
    DisplayPDF.where(item_id: itemID).delete
    DisplayPDF.create(item_id: itemID,
      orig_size:          origSize,
      orig_timestamp:     origTimestamp,
      linear_size:        linSize,
      splash_info_digest: splashLinSize > 0 ? instrucDigest : nil,
      splash_size:        splashLinSize
    )

    puts sprintf("  Splash updated: lin=%d/%d = %.1f%%; splashLin=%d/%d = %.1f%%",
                 linSize, origSize, linSize*100.0/origSize,
                 splashLinSize, origSize, splashLinSize*100.0/origSize)
  rescue
    # If splashing fails, fall back and put the original file into S3 so we can still
    # access it from the front-end
    $s3Bucket.object("#{contentPfx}/#{itemID}/#{itemID}.pdf").
      upload_file(origFile, { metadata: { sha256: calcSha256(origFile) },
                              content_type: "application/pdf",
                              storage_class: "INTELLIGENT_TIERING" })
    $s3Bucket.object("#{contentPfx}/#{itemID}/#{itemID}_noSplash_#{calcNoSplashKey(itemID)}.pdf").
      upload_file(origFile, { metadata: { sha256: calcSha256(origFile) },
                              content_type: "application/pdf",
                              storage_class: "INTELLIGENT_TIERING" })
    DisplayPDF.where(item_id: itemID).delete
    raise
  ensure
    linFile and linFile.unlink
    linDiff and linDiff.unlink
    splashLinFile and splashLinFile.unlink
    splashLinDiff and splashLinDiff.unlink
  end
end

###################################################################################################
# Main driver
arks = ARGV.select { |a| a =~ /qt\w{8}/ }
arks.empty? and raise("Must specify item(s) to convert.")
arks.each { |ark|
  begin
    puts "Splashing #{ark}."
    convertPDF(ark)
  rescue Exception => e
    e.is_a?(Interrupt) || e.is_a?(SignalException) and raise
    puts "Exception: #{e} #{e.backtrace}"
  end
}
