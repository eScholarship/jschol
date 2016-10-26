#!/usr/bin/env ruby

# This script converts data from old eScholarship into the new eschol5 database.
#
# The "--units" conversion mode should generally be run on a newly cleaned-out 
# database. This sequence of commands should do the trick:
#
#   bin/sequel config/database.yaml -m migrations/ -M 0 && \
#   bin/sequel config/database.yaml -m migrations/ && \
#   ./convert.rb /path/to/allStruct.xml
#
# The "--items" conversion mode is built to be fully incremental.

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'aws-sdk'
require 'date'
require 'json'
require 'logger'
require 'mimemagic'
require 'mimemagic/overlay' # for Office 2007+ formats
require 'nokogiri'
require 'open3'
require 'pp'
require 'sequel'
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
# Convert an allStruct element, and all its child elements, into the database.
def convertUnits(el, parentMap, childMap)
  id = el[:id] || el[:ref] || "root"
  #puts "name=#{el.name} id=#{id.inspect} name=#{el[:label].inspect}"

  # Handle the root of the unit hierarchy
  if el.name == "allStruct"
    Unit.create(
      :id => "root",
      :name => "eScholarship",
      :type => "root",
      :is_active => true,
      :attrs => nil
    )
  # Handle regular units
  elsif el.name == "div"
    attrs = {}
    el[:directSubmit] and attrs[:directSubmit] = el[:directSubmit]
    el[:hide]         and attrs[:hide]         = el[:hide]
    Unit.create(
      :id => id,
      :name => el[:label],
      :type => el[:type],
      :is_active => el[:directSubmit] != "moribund",
      :attrs => JSON.generate(attrs)
    )
  # Multiple-parent units
  elsif el.name == "ref"
    # handled elsewhere
  end

  # Now recursively process the child units
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
    convertUnits(child, parentMap, childMap)
  }

  # After traversing the whole thing, it's safe to form all the hierarchy links
  if el.name == "allStruct"
    puts "Linking units."
    linkUnit("root", childMap, Set.new)
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
      end
      units += $unitAncestors[unitID]
    end
  end

  return [campuses.to_a, departments.to_a, journals.to_a]
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
  data.single("withdrawn")              and attrs[:withdrawn_date] = data.single("withdrawn")
  data.single("embargoed")              and attrs[:embargo_date] = data.single("embargoed")
  data.single("publisher")              and attrs[:publisher] = data.single("publisher")
  data.single("originalCitation")       and attrs[:orig_citation] = data.single("originalCitation")
  data.single("customCitation")         and attrs[:custom_citation] = data.single("customCitation")
  data.single("localID")                and attrs[:local_id] = { type: data.singleAttr("localID", :type, "other"),
                                                                 id:   data.single("localID") }
  data.multiple("publishedWebLocation") and attrs[:pub_web_loc] = data.multiple("publishedWebLocation")
  data.single("buyLink")                and attrs[:buy_link] = data.single("buyLink")

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
  if !supps.empty?
    supps.each { |supp|
      suppPath = "#{DATA_DIR}/13030/pairtree_root/#{itemID.scan(/\w\w/).join('/')}/#{itemID}/content/supp/#{supp[:file]}"
      if !File.exist?(suppPath)
        puts "Warning: can't find supp file #{supp[:file]}"
      else
        # Mime types aren't always reliable coming from Subi. Let's try harder.
        mimeType = MimeMagic.by_magic(File.open(suppPath))
        if mimeType && mimeType.type
          supp[:mimeType] = mimeType
        end
        (attrs[:supp_files] ||= []) << supp
      end
    }
  end

  # For eschol journals, populate the issue and section models.
  issue = section = nil
  issueNum = data.single("issue[@tokenize='no']") # untokenized is actually from "number"
  if data.single("pubType") == "journal" && data.single("volume") && issueNum
    issue = Issue.new
    issue[:unit_id] = data.multiple("entityOnly")[0]
    issue[:volume]  = data.single("volume")
    issue[:issue]   = issueNum
    issue[:pub_date] = parseDate(itemID, data.single("date")) || "1901-01-01"

    section = Section.new
    section[:name]  = data.single("sectionHeader") ? data.single("sectionHeader") : "default"
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

  # Populate the Item model instance
  dbItem = Item.new
  dbItem[:id]           = itemID
  dbItem[:source]       = data.single("source")
  dbItem[:status]       = attrs[:withdrawn_date] ? "withdrawn" : 
                          attrs[:embargo_date] ? "embargoed" : 
                          (rawMeta.attr("state") || "published")
  dbItem[:title]        = data.single("title")
  dbItem[:content_type] = data.single("format")
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
  dbAuthors = data.multiple("creator").each_with_index.map { |name, idx|
    ItemAuthor.new { |auth|
      auth[:item_id] = itemID
      auth[:attrs] = JSON.generate({name: name})
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
      authors:       data.multiple("creator", 1000),  # CloudSearch has max of 1000 entries per field
      abstract:      attrs[:abstract] || "",
      type_of_work:  data.single("type"),
      content_types: data.multiple("format"),
      disciplines:   attrs[:disciplines] ? attrs[:disciplines] : [""], # only the numeric parts
      peer_reviewed: attrs[:peerReviewed] ? 1 : 0,
      pub_date:      dbItem[:pub_date].to_date.iso8601 + "T00:00:00Z",
      pub_year:      dbItem[:pub_date].year,
      rights:        dbItem[:rights],
      sort_author:   (data.multiple("creator")[0] || "").gsub(/[^\w ]/, '').downcase,
    }
  }

  # Determine campus(es), department(s), and journal(s) by tracing the unit connnections.
  campuses, departments, journals = traceUnits(units)
  campuses.empty?    or idxItem[:fields][:campuses] = campuses
  departments.empty? or idxItem[:fields][:departments] = departments
  journals.empty?    or idxItem[:fields][:journals] = journals

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
    $csClient.upload_documents(documents: batch[:idxData], content_type: "application/json")
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
# Main driver for unit conversion.
def convertAllUnits
  # Let the user know what we're doing
  puts "Converting units."
  startTime = Time.now

  # Load allStruct and traverse it
  DB.transaction do
    allStructPath = "/apps/eschol/erep/xtf/style/textIndexer/mapping/allStruct.xml"
    open(allStructPath, "r") { |io|
      convertUnits(Nokogiri::XML(io, &:noblanks).root, {}, {})
    }
  end
end

###################################################################################################
# Main driver for item conversion
def convertAllItems(arks)
  # Let the user know what we're doing
  puts "Converting #{arks=="ALL" ? "all" : "selected"} items."

  # Build a list of all valid units
  $allUnits = {}
  Unit.each { |unit| $allUnits[unit.id] = unit }

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