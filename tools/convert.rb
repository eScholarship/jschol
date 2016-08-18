#!/usr/bin/env ruby

# This script converts data from old eScholarship into the new eschol5 database.
# It should generally be run on a newly cleaned-out database. This sequence of commands
# should do the trick:
#
# bin/sequel config/database.yaml -m migrations/ -M 0 && \
# bin/sequel config/database.yaml -m migrations/ && \
# ./convert.rb /path/to/allStruct.xml

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'date'
require 'json'
require 'logger'
require 'nokogiri'
require 'open3'
require 'pp'
require 'sequel'
require 'time'
require 'yaml'

# Max size (in bytes, I think) if a batch to send to AWS CloudSearch.
# According to the docs the absolute limit is 5 megs, so let's back off a 
# little bit from that and say 4.5 megs.
MAX_BATCH_SIZE = 4500*1024

# Max amount of full text we'll send with any single doc. AWS limit is 1 meg, so let's
# go a little short of that so we've got room for plenty of metadata.
MAX_TEXT_SIZE  = 950*1024

# The main database we're inserting data into
DB = Sequel.connect(YAML.load_file("config/database.yaml"))
#DB.logger = Logger.new($stdout)  # enable this to print out every SQL statement executed (for debugging)

# The old eschol queue database, from which we can get a list of indexable ARKs
QUEUE_DB = Sequel.connect(YAML.load_file("config/queueDb.yaml"))

# Queues for thread coordination
$prefilterQueue = SizedQueue.new(100)
$indexQueue = SizedQueue.new(100)

# Make puts thread-safe, and prepend each line with the thread it's coming from.
$stdoutMutex = Mutex.new
def puts(*args)
  $stdoutMutex.synchronize { 
    Thread.current[:name] and STDOUT.write("[#{Thread.current[:name]}] ")
    super(*args) 
  }
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
  open("prefilterDirs.txt", "w") { |io|
    batch.each { |itemID, timestamp|
      shortArk = itemID.sub(%r{^ark:/?13030/}, '')
      io.puts "13030/pairtree_root/#{shortArk.scan(/\w\w/).join('/')}/#{shortArk}"
      timestamps[shortArk] = timestamp
    }
  }

  # Run the XTF textIndexer in "prefilterOnly" mode. That way the stylesheets can do all the
  # dirty work of normalizing the various data formats, and we can use the uniform results.
  puts "Running prefilter batch of #{batch.size} items."
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
      if line =~ %r{>>> BEGIN prefiltered.*/(qt\w{8})/}
        shortArk = $1
      elsif line =~ %r{>>> END prefiltered}
        # Found a full block of prefiltered data. This item is ready for indexing.
        timestamps.include?(shortArk) or raise("Can't find timestamp for item #{shortArk.inspect} - did we not request it?")
        $indexQueue << [shortArk, timestamps[shortArk], buf.join]
        shortArk, buf = nil, []
      elsif line =~ /Warning: Unrecognized meta-data/
        # skip
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
def prefilterAll
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

  # Get an array of the content from a metadata field which we expect zero or more of.
  def multiple(name)
    return @root.xpath("meta/#{name}[@meta='yes']").map { |el| el.text }
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
# Extract metadata for an item, and add it to the current index batch.
# Note that we create, but don't yet add, records to our database. We put off really inserting
# into the database until the batch has been successfully processed by AWS.
def indexItem(itemID, timestamp, prefilteredData, batch)

  # Add in the namespace declaration to the individual article (since we're taking the articles
  # out of their outer context)
  prefilteredData.sub! "<erep-article>", "<erep-article xmlns:xtf=\"http://cdlib.org/xtf\">"
  puts "#{itemID}"

  # Parse the metadata
  data = MetaAccess.new(prefilteredData)
  if data.root.nil?
    puts "Huh? root is nil. prefilteredData=#{prefilteredData}"
    exit 1
  end

  # Grab the stuff we're jamming into the JSON 'attrs' field
  attrs = {}
  data.multiple("contentExists")[0] == "yes" and attrs[:contentExists] = true
  data.single("pdfExists"    ) == "yes" and attrs[:pdfExists] = true
  data.single("peerReview"   ) == "yes" and attrs[:peerReviewed] = true
  data.single("language"     )          and attrs[:language] = data.single("language")
  data.any("facet-discipline")          and attrs[:disciplines] = data.multiple("facet-discipline")

  # Filter out "n/a" abstracts
  data.single("description") && data.single("description").size > 3 and attrs[:abstract] = data.single("description")

  # Populate the Item model instance
  dbItem = Item.new
  dbItem[:id]           = itemID
  dbItem[:source]       = data.single("source")
  dbItem[:status]       = data.single("pubStatus") || "unknown"
  dbItem[:title]        = data.single("title")
  dbItem[:content_type] = data.single("format")
  dbItem[:genre]        = data.single("type")
  dbItem[:pub_date]     = data.single("date") || "1901-01-01"
  dbItem[:eschol_date]  = data.single("datestamp") || "1901-01-01" #FIXME: Think about this carefully. What's eschol_date for?
  dbItem[:rights]       = data.single("rights") || "public"
  dbItem[:attrs]        = JSON.generate(attrs)
  dbItem[:last_indexed] = timestamp
  dbItem[:ordering_in_sect] = data.single("document-order")

  # Populate ItemAuthor model instances
  dbAuthors = data.multiple("creator").each_with_index.map { |name, idx|
    ItemAuthor.new { |auth|
      auth[:item_id] = itemID
      auth[:attrs] = JSON.generate({name: name})
      auth[:ordering] = idx
    }
  }

  # For eschol journals, populate the issue and section models.
  issue = section = nil
  if data.single("pubType") == "journal" && data.single("volume") && data.single("issue")
    issue = Issue.new
    issue[:unit_id] = data.multiple("entityOnly")[0]
    issue[:volume]  = data.single("volume")
    issue[:issue]   = data.single("issue")
    issue[:pub_date] = data.single("date") || "1901-01-01"

    section = Section.new
    section[:name]  = data.single("sectionHeader") ? data.single("sectionHeader") : "default"
    section[:ordering] = data.single("document-order") ? data.single("document-order") : 1
  end

  # Process all the text nodes
  text = ""
  traverseText(data.root, text)

  # Create JSON for the full text index
  idxItem = {
    type:          "add",   # in CloudSearch land this means "add or update"
    id:            itemID,
    fields: {
      title:         dbItem[:title] || "",
      authors:       data.multiple("creator"),
      abstract:      attrs[:abstract] || "",
      content_types: data.multiple("format"),
      disciplines:   attrs[:disciplines] ? attrs[:disciplines].map { |ds| ds[/^\d+/] } : [""], # only the numeric parts
      peer_reviewed: attrs[:peerReviewed] ? 1 : 0,
      pub_date:      dbItem[:pub_date].to_date.iso8601 + "T00:00:00Z",
      pub_year:      dbItem[:pub_date].year,
      rights:        dbItem[:rights],
      sort_author:   (data.multiple("creator")[0] || "").gsub(/[^\w ]/, '').downcase,
      units:         data.multiple("facet-fullAffil").map { |fa| fa.sub(/.*::/, "") },
      text:          text.size > MAX_TEXT_SIZE ? text[0,MAX_TEXT_SIZE] : text
    }
  }
  idxData = JSON.generate(idxItem)

  # If this item won't fit in the current batch, send the current batch off and clear it.
  if batch[:idxDataSize] + idxData.size > MAX_BATCH_SIZE
    batch[:items].empty? or processBatch(batch)
    emptyBatch(batch)
  end

  # Make a list of all the units this item belongs to
  units = data.multiple("entityOnly").select { |unitID| 
    !$allUnits.include?(unitID) ? puts("Warning: item #{itemID} associated with unknown unit #{unitID}") : true
  }
  if units.empty?
    puts "Skipping item #{itemID}."
    return
  end

  # Now add this item to the batch
  batch[:items].empty? or batch[:idxData] << ",\n"  # Separator between records
  batch[:idxData] << idxData
  batch[:idxDataSize] += idxData.size
  batch[:items] << { dbItem: dbItem, dbAuthors: dbAuthors, dbIssue: issue, dbSection: section, units: units }
end

###################################################################################################
# Index all the items in our queue
def indexAll
  Thread.current[:name] = "index thread"  # label all stdout from this thread
  batch = emptyBatch({})
  loop do
    # Grab an item from the input queue
    itemID, timestamp, prefilteredData = $indexQueue.pop
    itemID or break

    # Extract data and index it (in batches)
    indexItem(itemID, timestamp, prefilteredData, batch)
  end

  # Finish off the last batch.
  batch.items.empty? or processBatch(batch)
end

###################################################################################################
def processBatch(batch)

  puts "Processing batch: nItems=#{batch[:items].size}, size=#{batch[:idxDataSize]}."

  # Finish the data buffer, and send to AWS
  batch[:idxData] << "]"
  host = "doc-eschol5-test-u5sqhz5emqzdh4bfij7uxsazny.us-west-2.cloudsearch.amazonaws.com"
  req = Net::HTTP::Post.new("/2013-01-01/documents/batch", initheader = {'Content-Type' =>'application/json'})
  req.body = batch[:idxData]
  response = Net::HTTP.new(host, 80).start {|http| http.request(req) }
  puts "response: #{response}"
  response.code == "200" or fail("Post to CloudSearch failed: #{response}: #{response.body}")

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
            data[:dbItem][:section] = sec.id
          end
        end
      end

      # Now insert the item and its authors
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

          UnitHier.where(:unit_id => unitID, :is_direct => false).map { |hier| hier.ancestor_unit }.each { |ancestor|
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
def convertAllItems
  # Let the user know what we're doing
  puts "Converting items."

  # Build a list of all valid units
  $allUnits = Set.new(Unit.map { |unit| unit.id })

  # Fire up threads for doing the work in parallel
  Thread.abort_on_exception = true
  prefilterThread = Thread.new { prefilterAll }
  indexThread = Thread.new { indexAll }

  # Convert all the items that are indexable
  QUEUE_DB.fetch("SELECT itemId, time FROM indexStates WHERE indexName='erep' ORDER BY itemId").each do |row|
    erepTime = Time.at(row[:time].to_i).to_time
    shortArk = row[:itemId].sub(%r{^ark:/?13030/}, '')
    item = Item[shortArk]
    if !item || item.last_indexed.nil? || item.last_indexed < erepTime
      $prefilterQueue << [shortArk, erepTime]
    else
      puts "#{shortArk} is up to date, skipping."
    end
  end

  $prefilterQueue << nil  # end-of-queue
  prefilterThread.join
  indexThread.join
end

###################################################################################################
# Main action begins here

startTime = Time.now

case ARGV[0]
  when "--units"
    convertAllUnits
  when "--items"
    convertAllItems
  else
    STDERR.puts "Usage: #{__FILE__} --units|--items"
    exit 1
end

puts "Elapsed: #{Time.now - startTime} sec."
puts "Done."