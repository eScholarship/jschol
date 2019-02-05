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
require 'zlib'

require_relative './subprocess.rb'
require_relative '../util/normalize.rb'

# Use "--test YYYY-MM-DD" to test log parsing for a certain date
if (pos = ARGV.index("--test"))
  ARGV.delete_at(pos)
  $testDate = Date.parse(ARGV.delete_at(pos))
end

# Make puts synchronous (e.g. auto-flush)
STDOUT.sync = true

# Always use the right directory (the parent of the tools dir)
Dir.chdir(File.dirname(File.expand_path(File.dirname(__FILE__))))

# The main database we're inserting data into
DB = Sequel.connect({
  "adapter"  => "mysql2",
  "host"     => ENV["ESCHOL_DB_HOST"] || raise("missing env ESCHOL_DB_HOST"),
  "port"     => ENV["ESCHOL_DB_PORT"] || raise("missing env ESCHOL_DB_PORT").to_i,
  "database" => ENV["ESCHOL_DB_DATABASE"] || raise("missing env ESCHOL_DB_DATABASE"),
  "username" => ENV["ESCHOL_DB_USERNAME"] || raise("missing env ESCHOL_DB_USERNAME"),
  "password" => ENV["ESCHOL_DB_PASSWORD"] || raise("missing env ESCHOL_DB_HOST") })

# Log for debugging
#File.exists?('statsCalc.sql_log') and File.delete('statsCalc.sql_log')
#DB.loggers << Logger.new('statsCalc.sql_log')

# Model class for each table
require_relative './models.rb'

# Utilities
require_relative './statsUtil.rb'

# We'll need some email forwarding info from the OJS database.
OJS_DB = Sequel.connect({
  "adapter"  => "mysql2",
  "host"     => ENV["OJS_DB_HOST"] || raise("missing env OJS_DB_HOST"),
  "port"     => ENV["OJS_DB_PORT"] || raise("missing env OJS_DB_PORT").to_i,
  "database" => ENV["OJS_DB_DATABASE"] || raise("missing env OJS_DB_DATABASE"),
  "username" => ENV["OJS_DB_USERNAME"] || raise("missing env OJS_DB_USERNAME"),
  "password" => ENV["OJS_DB_PASSWORD"] || raise("missing env OJS_DB_HOST") })

# Big prime used for making smallish (63-bit) digests out of big MD5 digests.
BIG_PRIME = 9223372036854775783 # 2**63 - 25 is prime. Kudos https://primes.utm.edu/lists/2small/0bit.html

$hostname = `/bin/hostname`.strip

ESCHOL5_RELEASE_DATE = Date.new(2017, 10, 19)  # we released on October 19, 2017.

# Cache some database values
$googleRefID = Referrer.where(domain: "google.com").first.id.to_s

# It's silly and wasteful to propagate every single little referrer up the chain, so we retain
# a certain number and lump the rest as "other".
MAX_REFS = 30

# Use COUNTER's list of robots, as it seems pretty complete and might be up-to-date
ROBOT_PATTERNS = JSON.parse(
  File.read("lib/COUNTER-Robots/COUNTER_Robots_list.json")).map { |h|
    h['pattern'].sub("\\[en]", "\\[en\\]")   # bug fix for one of their patterns
  }.map { |str| Regexp.new(str, Regexp::IGNORECASE) }

$robotChecked = {}

###################################################################################################
# Data classes (much more efficient in both memory and space than hashes)
class ItemSummary
  attr_accessor :unitsDigest, :peopleDigest, :minMonth
end

class RefAccum
  attr_accessor :refs, :other

  def initialize(h)
    @other = 0
    if !h.nil?
      @refs = h.dup
      clamp
    end
  end

  def initialize_copy(b)
    @other = b.other
    @refs = b.refs.dup
  end

  def add(b)
    @refs.merge!(b.refs) { |k,x,y| x+y }
    @other += b.other
    clamp
  end

  def clamp
    # Keep only the top refs
    while @refs.size > MAX_REFS
      min_val = min_key = nil
      @refs.each { |k,v|
        if min_val.nil? || v < min_val
          min_val = v
          min_key = k
        end
      }
      @other += min_val
      @refs.delete(min_key)
    end
  end

  def to_h
    result = @refs.dup
    @other > 0 and result[:other] = @other
    return result
  end
end

class EventAccum
  attr_accessor :hit, :dl, :vpdf, :vpg, :post, :google, :counts, :ref

  def initialize(h = nil)
    @hit = @dl = @vpdf = @vpg = @google = @post = 0
    h.nil? and return
    h.each { |k,v|
      if k == 'hit' || k == :hit
        @hit = v
      elsif k == 'dl' || k == :dl
        @dl = v
      elsif k == 'vpdf' || k == :vpdf
        @vpdf = v
      elsif k == 'vpg' || k == :vpg
        @vpg = v
      elsif k == 'post' || k == :post
        @post = v
      elsif k == 'ref' || k == :ref
        if h.size == 1 && h.keys[0] == $googleRefID
          @google = h[$googleRefID]
        else
          tmp = h[k].dup
          if tmp[$googleRefID]
            @google = tmp[$googleRefID]
            tmp.delete($googleRefID)
          end
          @ref = RefAccum.new(tmp)
        end
      else
        @other ||= {}
        @other[k] = v
      end
    }
  end

  def incPost
    @post += 1
  end

  def add(b)
    # Inline the most common properties for speed and memory efficiency
    @hit    += b.hit
    @dl     += b.dl
    @vpdf   += b.vpdf
    @vpg    += b.vpg
    @post   += b.post
    @google += b.google

    # Hash for less common counts
    if @counts.nil?
      b.counts.nil? or @counts = b.counts.clone
    elsif !b.counts.nil?
      @counts.merge!(b.counts) { |k,x,y| x+y }
    end

    # Hash for less common refs
    if @ref.nil?
      b.ref.nil? or @ref = b.ref.clone
    elsif !b.ref.nil?
      @ref.add(b.ref)
    end
  end

  def to_h
    result = {}
    @hit > 0 and result[:hit] = @hit
    @dl > 0 and result[:dl] = @dl
    @vpdf > 0 and result[:vpdf] = @vpdf
    @vpg > 0 and result[:vpg] = @vpg
    @post > 0 and result[:post] = @post
    @other.nil? or result.merge!(@other)
    if @google > 0
      result[:ref] = { $googleRefID => @google }
      @ref.nil? or result[:ref].merge!(@ref.to_h)
    elsif !@ref.nil?
      result[:ref] = @ref.to_h
    end
    return result
  end
end

###################################################################################################
# Deal with crazy encodings
def fixUtfEncoding(str)
  return str.encode('UTF-8', 'binary', invalid: :replace, undef: :replace, replace: '')
end

###################################################################################################
def eachLogLine(path)
  if path =~ /\.gz$/
    # WARNING! Ruby's GZipReader silently terminates before reading entire file. Proven with an
    #          AWS log file which I've checked in in case we want to prove again.
    #          `Zlib::GzipReader.open("rubyBad.gz").read.length` gives 12,696 instead of 15,285,64
    #          Appears to be this bug: https://bugs.ruby-lang.org/issues/9790
    #
    ##Zlib::GzipReader.open(path) { |io| yield io }
    # So instead, we punt to unix's gzip command.
    text = checkOutput("/bin/gunzip -c #{path}", false)
    # Deal with crazy encodings
    text = fixUtfEncoding(text)
    # Process line by line
    text.split("\n").each { |line|
      yield line
    }
  else
    File.open(path, "r") { |io|
      io.each_line { |line|
        yield fixUtfEncoding(line)
      }
    }
  end
end

###################################################################################################
class LogEventSource
  attr_reader :path, :date
  def srcName; raise("must implement"); end
  def eachEvent; raise("must implement"); end
end

class LogEvent
  attr_reader :ip, :time, :method, :path, :status, :referrer, :agent, :trace

  def initialize(ip, time, methd, path, status, referrer, agent, trace)
    @ip = ip
    @time = time
    @method = methd
    @path = path
    @status = status
    @referrer = referrer
    @agent = agent
    @trace = trace
  end

  def to_s
    "LogEvent: ip=#{@ip.inspect} time=#{@time.inspect} method=#{@method.inspect} path=#{@path.inspect} " +
    "status=#{@status.inspect} referrer=#{@referrer.inspect} agent=#{@agent.inspect} trace=#{@trace.inspect}"
  end
end

# Fieldspec for CloudFront logs v 1.0:
# #Fields: date time x-edge-location sc-bytes c-ip cs-method cs(Host) cs-uri-stem sc-status cs(Referer)
#          cs(User-Agent) cs-uri-query cs(Cookie) x-edge-result-type x-edge-request-id x-host-header
#          cs-protocol cs-bytes time-taken x-forwarded-for ssl-protocol ssl-cipher x-edge-response-result-type
#          cs-protocol-version
O_CF_time     = 1
O_CF_ip       = 4
O_CF_method   = 5
O_CF_uriStem  = 7
O_CF_status   = 8
O_CF_referrer = 9
O_CF_agent    = 10
O_CF_query    = 11

class CloudFrontLogEventSource < LogEventSource
  def initialize(path)
    @path = path
    m = path.match(%r{\. (?<year>  2\d\d\d ) -
                         (?<month> \d\d    ) -
                         (?<day>   \d\d    ) -
                         (?<hour>  \d\d    ) \.
                     }x)or raise("can't parse CF filename #{path.inspect}")
    @date = Time.utc(m[:year].to_i, m[:month].to_i, m[:day].to_i, m[:hour].to_i).localtime.to_date
  end

  def srcName
    "CloudFront"
  end

  def eachEvent
    nLines = 0
    eachLogLine(@path) { |line|
      nLines += 1
      if nLines == 1
        line =~ /Version: 1\.0/ or raise("expecting v 1.0 CloudFront log in #{path.inspect}")
        next
      elsif nLines == 2
        fieldSpec = line.split()[1,999]
        fieldSpec.index("time")           == O_CF_time &&
        fieldSpec.index("c-ip")           == O_CF_ip &&
        fieldSpec.index("cs-method")      == O_CF_method &&
        fieldSpec.index("cs-uri-stem")    == O_CF_uriStem &&
        fieldSpec.index("sc-status")      == O_CF_status &&
        fieldSpec.index("cs(Referer)")    == O_CF_referrer &&
        fieldSpec.index("cs(User-Agent)") == O_CF_agent &&
        fieldSpec.index("cs-uri-query")   == O_CF_query or raise("unexpected fieldspec for v 1.0 CloudFront log: #{line.inspect}")
      else
        next unless line.include?("GET") && (line.include?("/item") || line.include?("content"))
        values = line.split
        yield LogEvent.new(values[O_CF_ip],
                           parseTime(@date, values[O_CF_time], true), # isGmt: true
                           values[O_CF_method],
                           values[O_CF_query] == '-' ? values[O_CF_uriStem] : values[O_CF_uriStem]+'?'+values[O_CF_query],
                           values[O_CF_status].to_i,
                           values[O_CF_referrer] == '-' ? nil : fixUtfEncoding(URI.unescape(URI.unescape(values[O_CF_referrer]))),
                           values[O_CF_agent] == '-' ? nil : fixUtfEncoding(URI.unescape(URI.unescape(values[O_CF_agent]))),
                           nil)  # no trace ID
      end
    }
  end
end

# Fieldspec for ALB logs
# e.g. https 2018-03-03T05:43:14.641341Z app/pub-jschol-prd-alb/683d40c2feb7aa9f 157.55.39.138:4121 172.30.35.180:18880
#      0.000 0.157 0.000 500 500 301 475
#      "GET https://escholarship.org:443/search/?q=Dur\xC3\x83\xC2\xA1n,%20Mercedes HTTP/1.1"
#      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" ECDHE-RSA-AES128-GCM-SHA256 TLSv1.2
#      arn:aws:elasticloadbalancing:us-west-2:451826914157:targetgroup/pub-jschol-prd-tg/a1d8bd825b060349
#      "Root=1-5a9a35f2-d2421d2484bafe92b1e358c8" "escholarship.org" "session-reused" 0
# See http://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-access-logs.html
O_ALB_type = 0
O_ALB_timestamp = 1
O_ALB_elb = 2
O_ALB_client_port = 3
O_ALB_target_port = 4
O_ALB_request_processing_time = 5
O_ALB_target_processing_time = 6
O_ALB_response_processing_time = 7
O_ALB_elb_status_code = 8
O_ALB_target_status_code = 9
O_ALB_received_bytes = 10
O_ALB_sent_bytes = 11
O_ALB_request = 12
O_ALB_user_agent = 13
O_ALB_ssl_cipher = 14
O_ALB_ssl_protocol = 15
O_ALB_target_group_arn = 16
O_ALB_trace_id = 17
O_ALB_domain_name = 18
O_ALB_chosen_cert_arn = 19

ALB_PORT_PAT = %r{^ (?<ip>   \d+\.\d+\.\d+\.\d+) :
                  (?<port> \d+)
               $}x

ALB_REQ_PAT = %r{^ (?<method>   [-A-Z]+) \s
                  (?<protocol> [^/]+) ://
                  (?<host>     [^/:]+)
                  (: (?<port>  \d+))?
                  (?<path>     .*) \s
                  (?<proto2>   [A-Z]+/[\d.]+)
              $}x

class ALBLogEventSource < LogEventSource
  def initialize(path)
    @path = path
    m = path.match(%r{_ (?<year>   2\d\d\d )
                        (?<month>  \d\d    )
                        (?<day>    \d\d    ) T
                        (?<hour>   \d\d    )
                        (?<minute> \d\d    ) Z
                     }x)or raise("can't parse ALB filename #{path.inspect}")
    @date = Time.utc(m[:year].to_i, m[:month].to_i, m[:day].to_i, m[:hour].to_i, m[:minute]).localtime.to_date
  end

  def srcName
    "ALB"
  end

  def eachEvent
    eachLogLine(@path) { |line|
      next unless line.include?("GET") && (line.include?("/item/") || line.include?("content/"))
      m1 = line.scan(/"[^"]*"|\S+/).map { |s| s.gsub('"', '') }
      m1.length >= O_ALB_chosen_cert_arn or raise("can't parse ALB line #{line.inspect}")
      m1[O_ALB_target_group_arn] =~ /^(-$|arn:aws)/ or raise("bad parse of ALB line #{line.inspect}")
      m2 = m1[O_ALB_client_port].match(ALB_PORT_PAT) or raise
      next if m1[O_ALB_request] =~ /:\d+-/  # e.g. weird things like: "- http://pub-jschol-prd-alb-blah.amazonaws.com:80- "
      m3 = m1[O_ALB_request].match(ALB_REQ_PAT) or raise("can't match request #{m1[O_ALB_request].inspect}")
      yield LogEvent.new(m2[:ip],
                         Time.parse(m1[O_ALB_timestamp]).localtime,
                         m3[:method],
                         m3[:path],
                         m1[O_ALB_elb_status_code].to_i,
                         nil,   # unfortunately, have to use trace to link referrer from jschol logs
                         m1[O_ALB_user_agent] == '-' ? nil : m1[O_ALB_user_agent],
                         m1[O_ALB_trace_id])
    }
  end
end

# Jschol log line patterns
# e.g. [4] 157.55.39.165 - - [18/Dec/2017:00:00:02 -0800] "GET /search/?q=Kabeer,%20Naila HTTP/1.1, 3.1.2"
#      200 - 0.7414 - "Root=1-5a377581-76cf406644dc717f3fd2ecbb"
JSCHOL_LINE_PAT = %r{\[ (?<thread>    \d+       ) \] \s
                        (?<ips>       [\w.:, ]+ ) \s
                        (?<skip1>     -         ) \s
                        (?<skip2>     -         ) \s
                     \[ (?<timestamp> [^\]]+    ) \] \s
                     "  (?<request>   [^"]+     ) " \s
                        (?<status>    \d+       ) \s
                        (?<size>      -|[-\d]+  ) \s
                        (?<elapsed>   -|[\d.]+  )
                        (\s (- | ("(?<referrer> [^"]*)"))
                         \s (- | ("(?<trace_id> [^"]*)")))?
                    $}x
JSCHOL_REQ_PAT = %r{^ (?<method>   [A-Z]+ ) \s
                      (?<path>     .*     ) \s
                      (?<proto2>   [A-Z]+/[\d.]+)
                      (,\s (?<ver> \d+\.[\d.]+))?
                  $}x

class JscholLogEventSource < LogEventSource
  def initialize(path)
    @path = path
    m = path.match(%r{jschol\. (?<year>   2\d\d\d ) \.
                               (?<month>  \d\d    ) \.
                               (?<day>    \d\d    )
                     }x) or raise("can't parse jschol log filename #{path.inspect}")
    @date = Date.new(m[:year].to_i, m[:month].to_i, m[:day].to_i)
  end

  def srcName
    "jschol"
  end

  def eachEvent
    eachLogLine(@path) { |line|
      next unless line.include?("GET") && (line.include?("/item/") || line.include?("content/"))
      m1 = line.match(JSCHOL_LINE_PAT)
      if !m1
        if line =~ /\[\d+\] \d+\.\d+\.\d+\.\d+/
          puts "Warning: skipping #{line.inspect}"
        end
        next  # lots of other kinds of lines come out of jschol; ignore them
      end
      m2 = m1[:request].match(JSCHOL_REQ_PAT) or raise("can't match request #{m1[:request].inspect}")
      ip = nil
      m1[:ips].split(/, ?/).each { |addr|
        addr =~ /^\d+\.\d+\.\d+\.\d+$/ and ip ||= addr
      }
      ip or raise("can't find ip in #{m1[:ips].inspect}")
      m3 = m1[:timestamp].match(%r{[^:]+:(?<time>[\d:]+)})
      m3 or raise("can't parse time in #{m1[:timestamp]}")
      yield LogEvent.new(m1[:ips].sub(/,.*/, ''),  # just the first IP (second is often CloudFront)
                         parseTime(@date, m3[:time], false), # false = local time
                         m2[:method],
                         m2[:path],
                         m1[:status].to_i,
                         m1[:referrer] && !m1[:referrer].empty? ? m1[:referrer] : nil,
                         nil,
                         m1[:trace_id] && !m1[:trace_id].empty? ? m1[:trace_id] : nil)
    }
  end
end

###################################################################################################
def parseDate(dateStr)
  dateStr.instance_of?(Date) and return dateStr
  dateStr.instance_of?(DateTime) and return dateStr.to_date
  ret = Date.strptime(dateStr, "%Y-%m-%d")
  ret.year > 1000 && ret.year < 4000 or raise("can't parse date #{dateStr}")
  return ret
end

###################################################################################################
# Convert a digest (e.g. MD5, SHA1) to a 63-bit number for memory efficiency
def calcIntDigest(digester)
  return digester.hexdigest.to_i(16) % BIG_PRIME
end

###################################################################################################
# Convert a digest (e.g. MD5, SHA1) to a short base-64 digest, without trailing '=' chars
def calcBase64Digest(digester)
  return digester.base64digest.sub(/=+$/,'')
end

###################################################################################################
# Calculate the hash of units for each item
def calcUnitDigests(result)
  prevItem, digester = nil, nil
  UnitItem.select_order_map([:item_id, :unit_id]).each { |item, unit|
    if prevItem != item
      prevItem.nil? or result[prevItem].unitsDigest = calcIntDigest(digester)
      prevItem, digester = item, Digest::MD5.new
    end
    digester << unit
  }
  prevItem.nil? or result[prevItem].unitsDigest = calcIntDigest(digester)
  return result
end

###################################################################################################
# Calculate the hash of people for each item
def calcPeopleDigests(result)
  prevItem, digester = nil, nil
  ItemAuthor.where(Sequel.~(person_id: nil)).select_order_map([:item_id, :person_id]).each { |item, person|
    if prevItem != item
      prevItem.nil? or result[prevItem].peopleDigest = calcIntDigest(digester)
      prevItem, digester = item, Digest::MD5.new
    end
    digester << person
  }
  prevItem.nil? or result[prevItem].peopleDigest = calcIntDigest(digester)
  return result
end

###################################################################################################
# Get minimum effective month for every item
def calcMinMonths(result)
  # Start with the submission date for each item
  Item.where(Sequel.lit("submitted is not null")).select_map([:id, :submitted]).each { |item, subDate|
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
# Get minimum effective month for every item
def calcMonthCounts()
  result = Hash.new { |h,k| h[k] = 0 }
  ItemEvent.group_and_count(:date).each { |record|
    result[record.date.year*100 + record.date.month] += record[:count]
  }
  return result
end

###################################################################################################
# Calculate a digest of items and people for each month of stats.
def calcStatsMonths()

  # Determine the size of each month, for time estimation during processing
  puts "Estimating work to be done."
  puts "  Calculating month counts."
  monthCounts = calcMonthCounts()
  itemSummaries = Hash.new { |h,k| h[k] = ItemSummary.new }

  # Create the mega-digest that summarizes all the items and units and people for each month.
  puts "  Calculating unit digests."
  calcUnitDigests(itemSummaries)

  puts "  Calculating people digests."
  calcPeopleDigests(itemSummaries)

  puts "  Calculating min month for each item."
  calcMinMonths(itemSummaries)

  # Figure out the grand summation digest for each month, by iterating the items in ascending
  # month order and adding all their stuff to a rolling MD5 digester.
  puts "  Grouping by month."
  monthDigests = {}
  prevMonth, digester = nil, nil
  itemSummaries.keys.sort { |a,b|
    (itemSummaries[a].minMonth || 0) <=> (itemSummaries[b].minMonth || 0)
  }.each { |itemID|
    summ = itemSummaries[itemID]
    summ.minMonth.nil? and next
    if prevMonth != summ.minMonth
      prevMonth.nil? or monthDigests[prevMonth] = calcBase64Digest(digester)
      prevMonth, digester = summ.minMonth, Digest::MD5.new
    end
    digester << itemID << summ.unitsDigest.inspect << summ.peopleDigest.inspect
  }
  prevMonth.nil? or monthDigests[prevMonth] = calcBase64Digest(digester)

  # Update the month digests in the database.
  DB.transaction {
    monthDigests.each { |month, digest|
      StatsMonth.create_or_update(month, cur_digest: digest, cur_count: monthCounts[month])
    }
  }
end

###################################################################################################
def calcNextMonth(month)
  my = month / 100
  mm = month % 100
  mm += 1
  if mm > 12
    mm = 1
    my += 1
  end
  return my*100 + mm
end

###################################################################################################
# For stats, we define 'category': a complicated melange of unit type + hierarchy, and item source.
def gatherItemCategories

  # There's an order to things. The first category for an item wins (hence the use of "||=" when
  # adding things to this hash).
  itemCategory = {}

  # Springer and Biomed are easy to identify
  Item.where(source: 'springer').select_map(:id).each { |item| itemCategory[item.to_s] ||= "postprints:Springer" }
  Item.where(source: 'biomed').select_map(:id).each { |item| itemCategory[item.to_s] ||= "postprints:BioMed" }

  # All items from LBNL are considered postprints
  UnitItem.where(unit_id: 'lbnl').distinct.select_map(:item_id).each { |item|
    itemCategory[item] ||= "postprints:LBNL"
  }

  # Campus postprint series are units that have "_postprints" in their name.
  UnitItem.where(Sequel.like(:unit_id, '%_postprints')).distinct.select_map(:item_id).each { |item|
    itemCategory[item] ||= "postprints:campus"
  }

  # Everything in an ETD series is an ETD
  UnitItem.where(Sequel.like(:unit_id, '%_etd')).distinct.select_map(:item_id).each { |item|
    itemCategory[item] ||= "ETDs"
  }

  # Take unit type into consideration
  unitType = {}
  Unit.select_map([:id, :type]).each { |unit, type|
    next if unit == "root"
    unitType[unit] = case type
      when 'campus', 'oru';    "ORU / campus"
      when 'journal';          "journals"
      when 'monograph_series'; "monographic series"
      when 'series';           "series"
      when 'seminar_series';   "seminar series"
      else                     raise("unknown unit type mapping: #{type}")
    end
  }

  UnitItem.where(is_direct: true).order(:ordering_of_units).select_map([:unit_id, :item_id]).each { |unit, item|
    unitType[unit] and itemCategory[item] ||= unitType[unit]
  }

  # Filter out unpublished and no-content items
  ## Unnecessary
  #DB["SELECT id FROM items WHERE status != 'published' OR attrs->'$.suppress_content' is not null"].each { |row|
  #  itemCategory.delete(row[:id])
  #}

  # All done.
  return itemCategory
end

###################################################################################################
# Calculate a digest of items and people for each month of stats.
def propagateItemMonth(itemUnits, itemCategory, monthPosts, month)
  puts "Propagating month #{month}."

  # We will accumulate data into these hashes
  itemStats     = Hash.new { |h,k| h[k] = EventAccum.new }
  unitStats     = Hash.new { |h,k| h[k] = EventAccum.new }
  categoryStats = Hash.new { |h,k| h[k] = EventAccum.new }

  # First handle item postings for this month
  (monthPosts || []).each { |item|
    itemStats[item].incPost
    itemUnits[item].each { |unit|
      unitStats[unit].incPost
      categoryStats[[unit, itemCategory[item] || 'unknown']].incPost
    }
  }

  # Next accumulate events for each items accessed this month
  startDate = Date.new(month/100, month%100, 1)
  endDate   = startDate >> 1  # cool obscure operator that adds one month to a date
  ItemEvent.where{date >= startDate}.where{date < endDate}.each { |event|
    accum = EventAccum.new(JSON.parse(event.attrs))
    item = event.item_id
    itemStats[item].add(accum)
    itemUnits[item].each { |unit|
      unitStats[unit].add(accum)
      categoryStats[[unit, itemCategory[item] || 'unknown']].add(accum)
    }
  }

  # Write out all the stats
  DB.transaction {
    ItemStat.where(month: month).delete
    itemStats.each { |item, accum|
      ItemStat.create(item_id: item, month: month, attrs: accum.to_h.to_json)
    }

    UnitStat.where(month: month).delete
    unitStats.each { |unit, accum|
      UnitStat.create(unit_id: unit, month: month, attrs: accum.to_h.to_json)
    }

    CategoryStat.where(month: month).delete
    categoryStats.each { |unitCat, accum|
      unit, category = unitCat
      CategoryStat.create(unit_id: unit, category: category, month: month, attrs: accum.to_h.to_json)
    }

    # And mark this month complete.
    sm = StatsMonth.where(month: month)
    sm.update(old_digest: sm.first.cur_digest)
  }
end

###################################################################################################
def calcStats
  puts "Gathering item categories."
  itemCategory = gatherItemCategories

  puts "Gathering item-unit associations."
  itemUnits = UnitItem.select_hash_groups(:item_id, :unit_id)
  # Attribute all items without a unit directly to root
  DB.fetch("SELECT id FROM items WHERE id NOT IN (SELECT item_id FROM unit_items)").each { |row|
    itemUnits[row[:id]] = [ 'root' ]
  }

  puts "Gathering item posting dates."
  monthPosts = Hash.new { |h,k| h[k] = [] }
  # Omit non-published items from posting counts.
  # NOTE: These numbers differ slightly from old (eschol4) stats because our new code converter
  #       (based on normalization stylesheets) has better date calulation for ETDs (using the
  #       history.xml file instead of timestamp on meta).
  Item.where(status: 'published').
       select_map([:id, :submitted]).each { |item, sdate|
    sdate.nil? and raise("item #{item} missing 'submitted' date")
    sdate = parseDate(sdate)
    monthPosts[sdate.year*100 + sdate.month] << item
  }

  # Propagate all months that need it
  startTime = Time.now
  months = StatsMonth.order(:month).all.select { |sm| sm.cur_digest != sm.old_digest }
  totalCount = doneCount = 0
  months.each { |sm| totalCount += sm.cur_count }
  months.each { |sm|
    propagateItemMonth(itemUnits, itemCategory, monthPosts[sm.month], sm.month)
    doneCount += sm.cur_count
    if doneCount > 0
      elapsed = Time.now - startTime
      rate = doneCount / elapsed
      estRemaining = (totalCount - doneCount) / rate
      printf("%d/%d done (%.1f%%), est remaining: %d:%02d:%02d\n",
        doneCount, totalCount,
        doneCount * 100.0 / totalCount,
        estRemaining / 3600, (estRemaining % 3600) / 60, (estRemaining % 3600) % 60)
    end
  }
end

###################################################################################################
# Grab logs from their various places and put them into our 'awsLogs' directory
def grabLogs
  # If logs are fresh, skip.
  latest = Dir.glob("./awsLogs/alb-logs/**/*").inject(0) { |memo, path| [memo, File.mtime(path).to_i].max }
  age = ((Time.now.to_i - latest) / 60 / 60.0).round(1)
  if age <= 18
    puts "Logs grabbed #{age} hours ago; skipping grab."
    return
  end

  puts "Grabbing AppLoadBalancer logs."
  FileUtils.mkdir_p("./awsLogs/alb-logs")
  # Note: on production there's an old ~/.aws/config file that points to different AWS credentials.
  #       We use an explicit "instance" profile (also defined in that file) to get back to plain
  #       default instance credentials.
  checkCall("aws s3 sync --profile instance --quiet --delete s3://pub-s3-prd/jschol/alb-logs/ ./awsLogs/alb-logs/")
  puts "Grabbing CloudFront logs."
  FileUtils.mkdir_p("./awsLogs/cf-logs")
  checkCall("aws s3 sync --profile instance --quiet --delete s3://pub-s3-prd/jschol/cf-logs/ ./awsLogs/cf-logs/")
  puts "Grabbing jschol logs."
  FileUtils.mkdir_p("./awsLogs/jschol-logs/2a")
  checkCall("rsync -a --delete pub-jschol-prd-2a.escholarship.org:/apps/eschol/jschol/logs ./awsLogs/jschol-logs/2a/")
  FileUtils.mkdir_p("./awsLogs/jschol-logs/2c")
  checkCall("rsync -a --delete pub-jschol-prd-2c.escholarship.org:/apps/eschol/jschol/logs ./awsLogs/jschol-logs/2c/")
end

###################################################################################################
def isRobot(agent)
  # Keep the check cache small
  #$robotChecked.size > 1000 and $robotChecked = Hash[$robotChecked.to_a[500,500]]
  $robotChecked.key?(agent) and return $robotChecked[agent]

  # It appears most of the "nil" referers aren't people with privacy settings, but rather are
  # unidentified bots in EC2 and Asia. Hard to know for sure, but log counts are suggestive.
  if agent.nil?
    return $robotChecked[agent] = true
  end

  # First check counter's list
  found = ROBOT_PATTERNS.find { |pat| pat =~ agent }
  found and return $robotChecked[agent] = found

  # Real user-agents have lots of spaces in them
  if agent.split(" ").length < 6
    return $robotChecked[agent] = "suspiciously few words"
  end

  # Agents that need a URL or advertise a .com service are clearly robots
  if agent.include?(".com") || agent.include?("http")
    return $robotChecked[agent] = "link or .com in agent"
  end

  # Okay, we guess it's not a robot.
  return $robotChecked[agent] = false
end

###################################################################################################
def identifyEvent(srcName, event)

  # Don't consider OPTIONS or HEAD to be full requests
  event.method == "GET" or return "noget"

  # Consider 2xx and 304 (not modified) to be success
  (event.status >= 200 && event.status <= 299) || event.status == 304 or return "req-fail"

  # Examine the path to figure out if it's a hit we're interested in
  ark = attrs = nil
  if event.path =~ %r{^(/dist/prd)?/content/(qt\w{8})/(qt\w{8}).pdf(.*)}
    # PDF downloads (they'll be /dist/prd/content on CloudFront, /content on ALB or jschol)
    cf, ark, ark2, after = $1, $2, $3, $4
    if ark == ark2
      attrs = after.include?("v=lg")     ? { hit: 1, dl: 1, vlg: 1 } :
              after.include?("nosplash") ? { hit: 1, vpdf: 1 } :  # this is the pdf.js viewer
                                           { hit: 1, dl: 1 }
    end
  elsif event.path =~ %r{(/dist/prd)?/content/(qt\w{8})/supp/(.+)}
    # Supp file downloads
    cf, ark, after = $1, $2, $3
    attrs = { hit: 1, supp: 1 }
  elsif event.path =~ %r{/(uc|api)/item/(\w{8})(.*)}
    # Normal item views
    pageOrApi, miniArk, after = $1, $2, $3
    ark = "qt#{miniArk}"
    attrs = { hit: 1, vpg: 1 }
  end

  if ark
    attrs && event.time and attrs[:time] = (event.time.hour * 100) + event.time.min
    # For robot ID, jschol doesn't have agent strings, and is only used for linking anyway.
    return ark, attrs, srcName != "jschol" && isRobot(event.agent)
  else
    return "no-match"
  end
end

###################################################################################################
def extractReferrer(item, event)
  ref = event.referrer.downcase.strip

  # Skip self-refs from an eschol item to itself
  if ref =~ /escholarship\.org|repositories\.cdlib\.org/
    ref.include?(item.sub(/^qt/,'')) || ref.include?("pdfjs") and return nil
    #puts "#{item}|#{ref} -> eschol"
    return "escholarship.org"
  end

  ref.include?("escholarship.org") and raise("what: #{ref.inspect}")

  return case ref
  when /google\./;             "google.com"
  when /yahoo\./;              "yahoo.com"
  when /bing\./;               "bing.com"
  when /wikipedia\./;          "wikipedia.org"
  when /repec\./;              "repec.org"
  when /bepress\./;            "bepress.com"
  when /facebook\./;           "facebook.com"
  when %r{^https?://([^/:]+)}; $1.sub(/^www\./, '')
  else;                        nil
  end
end

###################################################################################################
def quoteStr(str)
  str.nil? and return %{""}
  return %{"#{str.sub('"', '&quot;')}"}
end

###################################################################################################
def describeAttrs(attrs)
  attrs.nil? and return ""
  desc = []
  attrs[:vpg] and desc << "loaded item"
  attrs[:vpdf] and desc << "saw inline pdf"
  if attrs[:dl]
    if attrs[:vlg]
      desc << "viewed larger"
    else
      desc << "downloaded PDF"
    end
  end
  attrs[:supp] and desc << "downloaded supp"
  desc.empty? and raise("can't describe #{attrs}")
  return desc.join(", ")
end

###################################################################################################
def decodeMinutes(codedTime)
  # We encode times for ease of human reading, i.e. 1230 is 12:30
  return ((codedTime / 100) * 60) + (codedTime % 100)
end

###################################################################################################
# We fairly often get a view-page from one IP, then a PDF download from another IP, but
# they're linked in time and user agent or IP.
#
# Sometimes this happens because ALB is IPv4 whereas CloudFront supports IPv6.
# Other times it's due to a mobile device switching from one app to another.
#
# The following logic is intended to identify and collapse these.
def dedupeSessions(sessions, sessionCounts)
  out = []
  prevSession = nil
  prevAttrs = nil
  sessions.sort{ |a,b| a[1][:time].to_i <=> b[1][:time].to_i }.each { |session, attrs|
    if prevSession
      # Consider pairs that are at most a minute apart in time.
      if (decodeMinutes(attrs[:time]) - decodeMinutes(prevAttrs[:time])) <= 1
        prevIP, prevAgent = prevSession
        thisIP, thisAgent = session
        # Combine pairs that share a user-agent or an IP addr (minus the port in IPv6)
        if prevAgent == thisAgent || prevIP.sub(/::.*$/, '') == thisIP.sub(/::.*$/, '')
          #puts "... combine!"
          prevAttrs.merge! attrs
          sessionCounts[session] -= 1
          next
        end
      end
    end
    out << [session, attrs]
    prevSession = session
    prevAttrs = attrs
  }
  return Hash[out]
end

###################################################################################################
def parseDateLogs(date, sources)
  puts "Parsing logs from #{date.iso8601}."
  startTime = Time.now

  albLinks = {}
  sessionCounts = Hash.new { |h,k| h[k] = 0 }
  itemSessions  = Hash.new { |h,k| h[k] = {} }
  $testDate and testEvents = Hash.new { |h,k| h[k] = [] }

  totalReq = 0
  robotReq = 0
  linkedRef = 0
  fooCount = nil  # TODO: remove fooCount after this logic is fully tested

  prevSrc = nil
  sources.each { |source|
    if source.srcName != prevSrc
      puts "Source: #{source.srcName}"
      prevSrc = source.srcName
      fooCount = 2**64
    end
    fooCount < 0 and next
    source.eachEvent { |event|
      fooCount -= 1
      fooCount < 0 and break
      item, attrs, isRobot = identifyEvent(source.srcName, event)
      if !attrs
        #puts "  skip: #{source.srcName} #{item} #{event}"
        #puts
        next
      end

      # Ascribe requests for redirected items to their target
      item = getFinalItem(item)

      # We use jschol events *only* to connect referrers to ALB events
      if source.srcName == "jschol"
        if event.trace && albLinks[event.trace] && !albLinks[event.trace][:ref] && event.referrer
          ref = extractReferrer(item, event)
          if ref
            #puts "Found matching ALB for trace #{event.trace}, " +
            #     "copying referrer #{event.referrer.inspect} to #{albLinks[event.trace]}"
            linkedRef += 1
            albLinks[event.trace][:ref] = { lookupReferrer(extractReferrer(item, event)) => 1 }
          end
        end
        next # only use for link, not for hit counting
      end

      # Exclude known and suspected robots
      session = [event.ip, event.agent]
      totalReq += 1
      if isRobot
        #puts "robot: #{event}"
        $testDate and testEvents[[item,session]] << ["skip: robot", event]
        robotReq += 1
        next
      end

      #puts "#{attrs}: #{source.srcName} #{event}"
      #puts

      # Ignore requests for an item after it is withdrawn
      itemInfo = getItemInfo(item)
      if !itemInfo
        $testDate and testEvents[[item,session]] << ["skip: invalid item", event]
        #puts "Skipping event for invalid item #{item}."
        next
      end
      wdlDate = itemInfo[:withdrawn_date]
      if wdlDate && date > wdlDate
        $testDate and testEvents[[item,session]] << ["skip: post-withdrawal hit", event]
        #puts "Skipping post-withdrawal event for item #{item} withdrawn on #{wdlDate}."
        next
      end

      # Ignore requests for embargoed items before the embargo expires.
      embDate = itemInfo[:embargo_date]
      if embDate && date < embDate
        $testDate and testEvents[[item,session]] << ["skip: pre-embargo hit", event]
        #puts "Skipping pre-embargo event for item #{item}, embargoed until #{embDate}."
        next
      end

      if itemSessions[item].key?(session)
        itemSessions[item][session].merge!(attrs)  # plain Ruby merge: replaces dupe values
      else
        itemSessions[item][session] = attrs
        sessionCounts[session] += 1
      end

      # This has to come after we've recorded the session attrs
      if source.srcName == "ALB" && event.trace
        albLinks[event.trace] = itemSessions[item][session]
      end

      $testDate and testEvents[[item,session]] << ["count", event]
    }
  }

  # Collapse view on one IP and download on a different IP, at basically the same time
  itemSessions.keys.each { |item|
    itemSessions[item] = dedupeSessions(itemSessions[item], sessionCounts)
  }

  # Identify aberrant sessions, using a very simple heuristic. See, real users just don't
  # access 50 papers a day. Or, only a few do, which we will mistakenly remove, but we're
  # undoubtedly also mistakenly letting through some stealth robots, so hopefully it
  # balances out.
  aberrantSessions = Set.new
  sessionCounts.each { |session, count|
    count > 50 and aberrantSessions << session
  }

  if $testDate
    testEvents.each { |k,v|
      item, session = k
      next unless aberrantSessions.include?(session)
      v.each { |arr|
        next unless arr[0] == "count"
        arr[0] = "filter out: #{sessionCounts[session]} hits > 50"
      }
    }
  end

  puts "Robot req: #{robotReq}/#{totalReq} (#{sprintf("%.1f", robotReq * 100.0 / totalReq)}%)"
  puts "Linked refs: #{linkedRef}"

  if $testDate
    puts "Writing robotsFound.out."
    open("robotsFound.out", "w") { |io|
      $robotChecked.each { |agent, value|
        value and io.puts("#{value} #{agent}")
      }
    }

    puts "Writing ipCounts.out."
    open("ipCounts.out", "w") { |io|
      sessionCounts.sort_by{ |a,b| b }.reverse.each { |session, count|
        next if aberrantSessions.include?(session)
        io.puts "#{count} #{session}"
      }
    }

    puts "Writing uniqCounts.out."
    open("uniqCounts.out", "w") { |io|
      itemSessions.each { |item, sessions|
        sessions.each { |session, attrs|
          io.puts "#{item}|#{session}|#{attrs}"
        }
      }
    }
  end

  # Clump hits by common item/time/location
  puts "Geolocating."
  totalHits = 0
  aberFiltered = 0
  finalAccum = {}
  itemSessions.keys.sort.each { |item|
    itemSessions[item].each { |session, attrs|
      totalHits += attrs[:hit]
      if aberrantSessions.include?(session)
        aberFiltered += attrs[:hit]
        next
      end

      loc = lookupGeoIp(session[0])
      time = attrs[:time]
      attrs.delete(:time)
      key = [item, time, loc]
      if !finalAccum.key?(key)
        finalAccum[key] = EventAccum.new(attrs)
      else
        finalAccum[key].add(EventAccum.new(attrs))
      end
    }
  }

  if $testDate
    puts "Writing finalCounts.out"
    open("finalCounts.out", "w") { |io|
      finalAccum.each { |key, accum|
        item, time, loc = key
        io.puts("#{item}|#{sprintf("%06d",time)}|#{sprintf("%-6s",loc)}|#{accum.to_h.to_s}")
      }
      puts "Aber filtered: #{aberFiltered}/#{totalHits}"
    }

    # Note: the session deduping above isn't reflected in this report.
    puts "Writing testCounts.csv"
    open("testCounts.csv", "w") { |io|
      io.puts %{"Item","Hit","Actions","IP addr","User-agent","Time","URL","Referrer"}
      testEvents.keys.sort{|a,b| a.to_s <=> b.to_s}.each { |k|
        item, session = k
        prevEvent = nil
        testEvents[k].sort{ |a,b| a[1].time <=> b[1].time }.each_with_index { |pair, idx|
          action, event = pair
          if idx == 0
            attrs = itemSessions[item][session]
            aberrantSessions.include?(session) and attrs = nil
            io.print "#{quoteStr(item)},#{quoteStr(describeAttrs(attrs))},"
          elsif prevEvent.path == event.path && (prevEvent.time - event.time).abs < 300
            next  # skip dupe requests for ranges of the PDF file
          else
            io.print ",,"
          end
          io.print "#{quoteStr(action)},#{quoteStr(event.ip)},#{quoteStr(event.agent)},#{event.time.strftime("%H:%M:%S")},"
          io.puts "#{quoteStr(event.path)},#{quoteStr(event.referrer)}"
          prevEvent = event
        }
      }
    }
  end

  # Write the events for this date to the database
  puts "Writing events to database."
  DB.transaction {
    ItemEvent.where(date: date).delete
    finalAccum.each { |key, accum|
      item, time, loc = key
      ItemEvent.create(item_id: item,
                       date: date,
                       time: time,
                       location: loc,
                       attrs: accum.to_h.to_json)
    }

    # Clear the digest for propagated stats for this month, so they'll get re-propagated.
    StatsMonth.where(month: date.month*100 + date.day).update(old_digest: nil)
  }

  puts "Elapsed time to process this day's logs: #{(Time.now - startTime).round(1)} sec."
  puts
end

###################################################################################################
# Figure out which logs need to be parsed.
def parseLogs
  logsByDate = Hash.new { |h,k| h[k] = [] }

  # CloudFront logs
  prev = ""
  Dir.glob("./awsLogs/cf-logs/**/*").sort.each { |fn|
    next if fn == prev+".gz"  # skip dupe gz of non-gz file
    prev = fn
    src = CloudFrontLogEventSource.new(fn)
    logsByDate[src.date] << src
  }

  # Application Load Balancer (ALB) logs
  Dir.glob("./awsLogs/alb-logs/**/*").sort.each { |fn|
    next unless File.file?(fn)
    next if fn =~ /ELBAccessLogTestFile/
    next if fn == prev+".gz"  # skip dupe gz of non-gz file
    prev = fn
    src = ALBLogEventSource.new(fn)
    logsByDate[src.date] << src
  }

  # jschol logs (needed to link referrers to ALB logs)
  Dir.glob("./awsLogs/jschol-logs/**/*").sort.each { |fn|
    next unless File.file?(fn)
    next if fn =~ %r{/iso\.}  # we only want the jschol logs, not iso logs
    next if fn == prev+".gz"  # skip dupe gz of non-gz file
    prev = fn
    src = JscholLogEventSource.new(fn)
    logsByDate[src.date] << src
  }

  # Test mode - just run a certain date
  if $testDate
    return parseDateLogs($testDate, logsByDate[$testDate])
  end

  # Form a digest for each date, so we can detect differences.
  dateDigests = Hash[logsByDate.map { |date, sources|
    [date, calcBase64Digest(sources.reduce(Digest::MD5.new) { |digester, src|
      digester << src.path << File.size(src.path).to_s
    })]
  }]

  # Now work our way back from the end, checking for differences. Stop at the first date that
  # has the same digest as previously processed. This logic is to prevent recalculating dates
  # long-past because they logs get expired and deleted.
  todo = []
  dateDigests.sort.reverse.each { |date, digest|
    existing = EventLog[date]
    break if existing and existing.digest == digest
    break if date <  ESCHOL5_RELEASE_DATE # ignore activity before release
    todo.unshift [date, digest]   # unshift so we end up in forward date order
  }

  # And process each one
  todo.each { |date, digest|
    next if date < ESCHOL5_RELEASE_DATE
    #next unless date.month == 12 && date.day == 1 # for testing
    parseDateLogs(date, logsByDate[date])
    EventLog.create_or_update(date, digest: digest)  # Record digest to avoid reprocessing tomorrow
  }
end

def combineForward(prevEmail, prevPerson, prevAttrs, curEmail, curPerson, curAttrs)
  return if prevAttrs['forwarded_to'] == curPerson[:id]

  curAttrs['prev_emails'] ||= []
  curAttrs['prev_emails'] << prevEmail
  if prevAttrs['prev_emails']
    curAttrs['prev_emails'] += prevAttrs['prev_emails']
    prevAttrs.delete('prev_emails')
  end
  curAttrs['prev_emails'].uniq!

  curAttrs['forwarded_from'] ||= []
  curAttrs['forwarded_from'] << prevPerson[:id]
  if prevAttrs['forwarded_from']
    # Complex case that does indeed occur, though rarely.
    prevAttrs['forwarded_from'].each { |wayOldId|
      wayOldPerson = Person.where(id: wayOldId).first
      next unless wayOldPerson  # skip forwards that don't involve our authors
      wayOldAttrs = JSON.parse(wayOldPerson[:attrs])
      wayOldEmail = wayOldAttrs['email']
      puts "Note: complex email forwarding:"
      puts "  curEmail: #{curEmail.inspect}"
      puts "  prevEmail: #{prevEmail.inspect}"
      puts "  way old email: #{wayOldEmail.inspect}"
      combineForward(wayOldEmail, wayOldPerson, wayOldAttrs, curEmail, curPerson, curAttrs)
      puts "  ...handled."
    }
    curAttrs['forwarded_from'] += prevAttrs['forwarded_from']
    prevAttrs.delete('forwarded_from')
  end
  curAttrs['forwarded_from'].uniq!

  prevAttrs['forwarded_to'] = curPerson[:id]

  puts "    Combining: #{prevAttrs}"
  puts "           to: #{curAttrs}"

  curPerson.attrs = curAttrs.to_json
  curPerson.save

  prevPerson.attrs = prevAttrs.to_json
  prevPerson.save

  # Switch all the item author records from old to new
  nItems = ItemAuthor.where(person_id: prevPerson[:id]).update(person_id: curPerson[:id])
  puts "    Updated #{nItems} item(s)."
end

###################################################################################################
# Email forwards are recorded in the OJS database. Apply these to forward/combine Person records.
def applyForwards
  # Grab the forwards from the OJS db and put them in a hash. This takes care of dupes (by
  # picking the last one in email order).
  puts "Applying email forwards to people."
  forwards = {}
  OJS_DB.fetch(%{
    select eschol_prev_email.email prev_email, users.email cur_email
    from eschol_prev_email
    inner join users on users.user_id = eschol_prev_email.user_id
    order by eschol_prev_email.user_id, eschol_prev_email.email
  }).each{ |row|
    prev = row[:prev_email].downcase.strip
    cur  = row[:cur_email].downcase.strip
    prev != cur and forwards[prev] = cur
  }

  # Gather the set of people emails that haven't yet gotten any forwarding.
  allPeopleEmails = Set.new(DB.fetch(%{
    select JSON_UNQUOTE(attrs->'$.email') email from people
  }).map { |r| r[:email] })

  # Check them against the people table
  forwards.keys.sort.each { |prevEmail|
    curEmail = prevEmail
    (0..10).each {
      forwards[curEmail] and curEmail = forwards[curEmail]
    }
    forwards[curEmail] and raise("forwarding loop detected involving #{curEmail}")
    next unless allPeopleEmails.include?(prevEmail)
    prevPerson = Person.where(Sequel.lit("attrs->'$.email' = ?", prevEmail)).first
    next unless prevPerson  # skip forwards that don't involve our authors
    curPerson = Person.where(Sequel.lit("attrs->'$.email' = ?", curEmail)).first
    prevAttrs = JSON.parse(prevPerson[:attrs])

    # Skip if already forwarded
    next if curPerson && prevAttrs['forwarded_to'] == curPerson[:id]

    #puts "\n  #{prevEmail} -> #{curEmail}"

    if curPerson.nil?
      # There's only one record, on which we can just change the email addr.
      prevAttrs['prev_emails'] ||= []
      prevAttrs['prev_emails'] << prevEmail
      prevAttrs['prev_emails'].uniq!
      prevAttrs['email'] = curEmail
      #puts "    Plain switch: #{prevAttrs}"
      prevPerson.attrs = prevAttrs.to_json
      prevPerson.save  # FIXME
    else
      # There are two records, prev and cur. We need to redirect prev to cur.
      curAttrs = JSON.parse(curPerson[:attrs])
      DB.transaction {
        combineForward(prevEmail, prevPerson, prevAttrs, curEmail, curPerson, curAttrs)
      }
    end
  }
end

###################################################################################################
# The main routine
lockFile = "/tmp/jschol_statsCalc.lock"
File.exist?(lockFile) or FileUtils.touch(lockFile)
lock = File.new(lockFile)
begin
  if !lock.flock(File::LOCK_EX | File::LOCK_NB)
    puts "Another copy is already running."
    exit 1
  end

  grabLogs
  loadItemInfoCache
  parseLogs
  $testDate and exit 0
  applyForwards
  calcStatsMonths
  calcStats

  puts "Done."
ensure
  lock.flock(File::LOCK_UN)
end
