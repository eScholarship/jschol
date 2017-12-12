#!/usr/bin/env ruby

# This script propagates raw item events to month-based summations for each
# item, unit, and person.

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Run from the right directory (the parent of the tools dir)
Dir.chdir(File.dirname(File.expand_path(File.dirname(__FILE__))))

# Remainder are the requirements for this program
require 'date'
require 'digest'
require 'fileutils'
require 'json'
require 'logger'
require 'pp'
require 'sequel'
require 'set'
require 'time'
require 'yaml'

# Make puts synchronous (e.g. auto-flush)
STDOUT.sync = true

# The main database we're inserting data into
DB = Sequel.connect(YAML.load_file("config/database.yaml"))

# Log for debugging
File.exists?('statsCalc.sql_log') and File.delete('statsCalc.sql_log')
DB.loggers << Logger.new('statsCalc.sql_log')

# Model class for each table
require_relative './models.rb'

BIG_PRIME = 9223372036854775783 # 2**63 - 25 is prime. Kudos https://primes.utm.edu/lists/2small/0bit.html

###################################################################################################
ItemSummary = Struct.new(:unitsDigest, :peopleDigest, :minMonth)

###################################################################################################
def parseDate(dateStr)
  ret = Date.strptime(dateStr, "%Y-%m-%d")
  ret.year > 1000 && ret.year < 4000 or raise("can't parse date #{dateStr}")
  return ret
end

###################################################################################################
# Convert a digest (e.g. MD5, SHA1) to a 63-bit number for memory efficiency
def getIntDigest(digester)
  return digester.hexdigest.to_i(16) % BIG_PRIME
end

###################################################################################################
# Calculate the hash of units for each item
def calcUnitDigests(result)
  prevItem, digester = nil, nil
  UnitItem.select_order_map([:item_id, :unit_id]).each { |item, unit|
    if prevItem != item
      prevItem.nil? or result[prevItem].unitsDigest = getIntDigest(digester)
      prevItem, digester = item, Digest::MD5.new
    end
    digester << unit
  }
  prevItem.nil? or result[prevItem].unitsDigest = getIntDigest(digester)
  return result
end

###################################################################################################
# Calculate the hash of units for each item
def calcPeopleDigests(result)
  prevItem, digester = nil, nil
  ItemAuthor.where(Sequel.~(person_id: nil)).select_order_map([:item_id, :person_id]).each { |item, person|
    if prevItem != item
      prevItem.nil? or result[prevItem].peopleDigest = getIntDigest(digester)
      prevItem, digester = item, Digest::MD5.new
    end
    digester << person
  }
  prevItem.nil? or result[prevItem].peopleDigest = getIntDigest(digester)
  return result
end

###################################################################################################
# Get minimum effective month for every item
def calcMinMonths(result)
  # Start with the submission date for each item
  Item.where(Sequel.lit("attrs->'$.submission_date' is not null")).select_map([:id, :attrs]).each { |item, attrStr|
    subDate = parseDate(JSON.parse(attrStr)["submission_date"])
    subDate.year >= 1995 or raise("invalid pre-1995 submission date #{subDate.iso8601} for item #{item}")
    result[item].minMonth = subDate.year*100 + subDate.month
  }

  minSym = "min(`date`)".to_sym
  ItemEvent.select_group(:item_id).select_append{min(:date)}.each { |record|
    item = record[:item_id]
    minDate = record[minSym]
    minMonth = minDate.year*100 + minDate.month
    if result[item].minMonth.nil?
      result[item].minMonth = minMonth
    else
      result[item].minMonth = [minMonth, result[item].minMonth].min
    end
  }
end

###################################################################################################
$fooRand = Random.new
def createPersonArk
  # FIXME: generate arks when we our shoulder has been granted
  return "foo:#{$fooRand.rand(BIG_PRIME)}"
end

###################################################################################################
# Connect people to authors
def connectAuthors

  # Skip if all authors were already connected
  unconnectedAuthors = ItemAuthor.where(Sequel.lit("attrs->'$.email' is not null and person_id is null"))
  nTodo = unconnectedAuthors.count
  nTodo > 0 or return

  # First, record existing email -> person correlations
  emailToPerson = {}
  Person.where(Sequel.lit("attrs->'$.email' is not null")).each { |person|
    email = JSON.parse(person.attrs)["email"].downcase
    if emailToPerson.key?(email) && emailToPerson[email] != person.id
      puts "Warning: multiple matching people for email #{email.inspect}"
    end
    emailToPerson[email] = person.id
  }

  # Then connect all unconnected authors to people
  nDone = 0
  DB.transaction {
    unconnectedAuthors.each { |auth|
      email = JSON.parse(auth.attrs)["email"].downcase
      person = emailToPerson[email]
      (nDone % 1000) == 0 and puts "Connecting authors: #{nDone} / #{nTodo}"
      if !person
        person = createPersonArk()
        Person.create(id: person, attrs: { email: email }.to_json)
        emailToPerson[email] = person
      end
      ItemAuthor.where(item_id: auth.item_id, ordering: auth.ordering).update(person_id: person)
      nDone += 1
    }
  }
  puts "Connecting authors: #{nDone} / #{nTodo}"
end

###################################################################################################
# The main routine
puts "connectAuthors"
connectAuthors
puts 'RAM USAGE: ' + `pmap #{Process.pid} | tail -1`[10,40].strip
itemSummaries = Hash.new { |h,k| h[k] = ItemSummary.new }
puts "calcUnitDigests"
calcUnitDigests(itemSummaries)
puts "calcMinMonths"
calcMinMonths(itemSummaries)
puts "calcPeopleDigests"
calcPeopleDigests(itemSummaries)
open("foo.summaries", "w") { |io|
  itemSummaries.each { |item, summ|
    io.puts "item=#{item} minMonth=#{summ.minMonth} unitsDigest=#{summ.unitsDigest} peopleDigest=#{summ.peopleDigest}"
  }
}
puts 'RAM USAGE: ' + `pmap #{Process.pid} | tail -1`[10,40].strip