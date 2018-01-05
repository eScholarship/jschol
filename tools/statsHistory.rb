#!/usr/bin/env ruby

# This script converts stats data from eschol4 to eschol5

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

# Always use the right directory (the parent of the tools dir)
Dir.chdir(File.dirname(File.expand_path(File.dirname(__FILE__))))

# The main database we're inserting data into
DB = Sequel.connect(YAML.load_file("config/database.yaml"))

# Log for debugging
#File.exists?('statsConv.sql_log') and File.delete('statsConv.sql_log')
#DB.loggers << Logger.new('statsConv.sql_log')

# Model class for each table
require_relative './models.rb'

# Utilities
require_relative './statsUtil.rb'

$referrerShortcuts = {
  'G' => 'google.com',
  'Y' => 'yahoo.com',
  'e' => 'escholarship.org',
  'B' => 'bing.com',
  'W' => 'wikipedia.org',
  'R' => 'repec.org',
  'b' => 'bepress.com'
}

###################################################################################################
def gatherFiles
  files = Hash.new { |h,k| h[k] = {} }
  Dir.glob("/apps/eschol/erep/xtf/stats/compiled/*/*/*").each { |path|
    next unless path =~ %r{stats\.(\d\d\d\d)\.(\d\d)\.(\d\d)}
    files[Date.new($1.to_i, $2.to_i, $3.to_i)][:compiled] = path
  }
  Dir.glob("/apps/eschol/tomcat/logs/access/combined/*").each { |path|
    next unless path =~ %r{extract\.access\.log\.(\d\d\d\d)\.(\d\d)\.(\d\d)}
    files[Date.new($1.to_i, $2.to_i, $3.to_i)][:extract] = path
  }
  return files
end

###################################################################################################
def lookupReferrerWithShortcuts(ref)
  # Translate shortcuts from old stats generator, e.g. "G" => "Google"
  return lookupReferrer($referrerShortcuts.key?(ref) ? $referrerShortcuts[ref] : ref)
end

###################################################################################################
def mergeHitData(att1, att2)
  return !att2 ? att1 : !att1 ? att2 : att1.merge(att2) { |key, a, b|
    a.is_a?(Fixnum) ? a+b : a.is_a?(Hash) ? mergeHitData(a, b) : raise("can't merge #{a}")
  }
end

###################################################################################################
def correlate(files, date)

  # First read the compiled data
  compiledInfo = {}
  files[date][:compiled] or raise("missing compiled data for #{date.iso8601}")
  puts files[date][:compiled]
  open(files[date][:compiled]).each_line { |line|
    # eg: "0002c67n|1|1|0|G=1|"
    m = line.match %r{^(?<ark>\w{8}) \|
                       (?<hit>\d+) \|
                       (?<dl>\d+) \|
                       (?<bag>\d+) \|
                       (?<referrers>[^\|]*) \|
                      $}x
    if !m; puts "Unparseable: #{line.inspect}"; next; end
    ark = getFinalItem("qt#{m[:ark]}")
    itemInfo = getItemInfo(ark)
    if !itemInfo
      puts "Warning: invalid compiled item #{ark.inspect}"
      next
    end

    # To match old stats generator, exclude hits after the *month* an item was withdrawn
    w = itemInfo[:withdrawn_date]
    if w && Date.new(date.year, date.month) > Date.new(w.year, w.month)
      puts "Skipping post-withdrawal event for item #{ark} withdrawn on #{w}"
      next
    end

    # Old stats generator retroactively counts hits for an embargoed item, after the embargo expires.
    # So, a stats report before the embargo date doesn't count the item at all.
    # and a stats report after  the embargo date suddently shows all prior hits.
    # We'll obey that weird policy for old stats, but not carry it over to new stats.
    e = itemInfo[:embargo_date]
    if e && e > Date.new(2017, 12, 5)
      puts "Skipping pre-embargo event for item #{ark}, embargoed until #{e} (after cutoff for old stats)"
      next
    end

    data = { hit: m[:hit].to_i, dl: m[:dl].to_i, bag: m[:bag].to_i, referrers: {} }
    totalRefs = 0
    m[:referrers].split(",").each { |refEq|
      ref, ct = refEq.split("=")
      ref && ct or raise("can't parse referrers: #{m[:referrers]}")
      data[:referrers][ref] = ct.to_i
      totalRefs += ct.to_i
    }
    totalRefs <= m[:hit].to_i or raise("too many refs: #{line.inspect}")
    compiledInfo[ark] = mergeHitData(compiledInfo[ark], data)
  }

  # Read the extract which has time and location
  extractInfo = Hash.new { |h,k| h[k] = [] }
  if files[date][:extract]
    open(files[date][:extract]).each_line { |line|
      # eg: "24/Aug/2013:17:27:57 -0700|42.3314|-83.0457|ark:/13030/qt04t8f8bp|view+dnld|ncbi.nlm.nih.gov"
      m = line.match %r{^(?<day>   \d+            ) /
                         (?<month> \w{3}          ) /
                         (?<year>  \d\d\d\d       ) :
                         (?<hour>  \d\d           ) :
                         (?<min>   \d\d           ) :
                         (?<sec>   \d\d           ) \s
                         (?<tz>    [-0-9]+        ) \|
                         (?<lat>   [-.0-9]*       ) \|
                         (?<long>  [-.0-9]*       ) \|
                         ark:/13030/(?<ark>qt\w{8}) \|
                         (?<action>view|view\+dnld) \|
                         (?<referrer>[^\|]*       )
                        \n$}x
      if !m; puts "Unparseable: #{line.inspect}"; next; end
      ark = getFinalItem(m[:ark])
      if !getItemInfo(ark)
        puts "Warning: invalid extract item #{ark.inspect}"
        next
      end
      ci = compiledInfo[ark]
      if !ci
        # This happens a lot: extracts can have unvalidated hits
        #puts("Warning: extract has excess ark #{ark.inspect}")
        next
      end
      isDownload = (m[:action] == "view+dnld")
      ref = m[:referrer].empty? ? nil : m[:referrer]
      date.day == m[:day].to_i && date.year == m[:year].to_i or raise("date mismatch")

      # Make sure there's a matching hit. Note that this happens quite frequently, because
      # extracts are more extensive than final matched hits.
      if (ci[:hit]||0) < 1
        #puts "Note: can't match extract to hit: #{line.inspect} vs #{ci}"
        next
      end
      if isDownload && (ci[:dl]||0) < 1
        #puts "Note: can't match extract to download: #{line.inspect} vs #{ci}"
        next
      end
      if ref && (ci.dig(:referrers, ref)||0) < 1
        #puts "Note: can't match extract to ref: #{line.inspect} vs #{ci}"
        next
      end

      # Decrease the general compiled hit, since we have more specific info
      ci[:hit] -= 1
      isDownload and ci[:dl] -= 1
      if ref
        ci[:referrers][ref] -= 1
        if ci[:referrers][ref] == 0
          ci[:referrers].delete(ref)
        end
      end

      # And record this info
      extractInfo[m[:ark]] << { hit: 1, dl: isDownload,
                                time: (m[:hour].to_i * 100) + m[:min].to_i,
                                lat: m[:lat].to_f.round(4), long: m[:long].to_f.round(4),
                                referrer: ref }
    }
  end

  # Write the combined info to the database.
  DB.transaction {
    # Delete existing data
    ItemEvent.where(date: date).delete

    # Mark that stats for this month need to be repropagated
    StatsMonth.where(month: date.year*100 + date.month).update(old_digest: nil)

    # Insert location-specific data from the extracts
    extractInfo.each { |ark, records|
      records.each { |record|
        attrs = { hit: record[:hit] }
        record[:dl] and attrs[:dl] = 1
        if record[:referrer] && lookupReferrerWithShortcuts(record[:referrer])
          attrs[:ref] = { lookupReferrerWithShortcuts(record[:referrer]) => 1 }
        end
        ItemEvent.create(
          item_id: ark,
          date: date,
          time: record[:time],
          location: lookupLocation(record[:lat], record[:long]),
          attrs: attrs.to_json
        )
      }
    }

    # Insert general data from the compiled logs
    compiledInfo.each { |ark, record|
      next if record[:hit] == 0  # skip if entirely accounted for by extracts
      attrs = { hit: record[:hit] }
      record[:dl] > 0 and attrs[:dl] = record[:dl]
      if record[:referrers].values.any? { |n| n > 0 }
        attrs[:ref] = {}
        record[:referrers].each { |k,v|
          v > 0 && lookupReferrerWithShortcuts(k) and attrs[:ref][lookupReferrerWithShortcuts(k)] = v
        }
      end
      ItemEvent.create(
          item_id: ark,
          date: date,
          attrs: attrs.to_json
      )
    }
  }
end

###################################################################################################
loadItemInfoCache
files = gatherFiles

files.keys.sort.each { |date|
  next if ItemEvent.where(date: date).count > 0 # skip already-processed.
  next unless date < Date.new(2017, 10, 19)     # skip post-eschol5 transition
  correlate(files, date)
}

applyItemRedirects
