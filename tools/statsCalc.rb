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
require 'ezid-client'
require 'fileutils'
require 'json'
require 'logger'
require 'netrc'
require 'pp'
require 'sequel'
require 'set'
require 'time'
require 'yaml'
require 'zlib'

require_relative './subprocess.rb'

# Make puts synchronous (e.g. auto-flush)
STDOUT.sync = true

# Always use the right directory (the parent of the tools dir)
Dir.chdir(File.dirname(File.expand_path(File.dirname(__FILE__))))

# The main database we're inserting data into
DB = Sequel.connect(YAML.load_file("config/database.yaml"))

# Log for debugging
#File.exists?('statsCalc.sql_log') and File.delete('statsCalc.sql_log')
#DB.loggers << Logger.new('statsCalc.sql_log')

# Model class for each table
require_relative './models.rb'

# Utilities
require_relative './statsUtil.rb'

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
# Configure EZID API for minting arks for people
Ezid::Client.configure do |config|
  (ezidCred = Netrc.read['ezid.cdlib.org']) or raise("Need credentials for ezid.cdlib.org in ~/.netrc")
  config.user = ezidCred[0]
  config.password = ezidCred[1]
  config.default_shoulder = case $hostname
    when 'pub-submit-stg-2a', 'pub-submit-stg-2c'; 'ark:/99999/fk4'
    when 'pub-submit-prd-2a', 'pub-submit-prd-2c'; 'ark:/99166/p3'
    else raise "Unrecognized hostname for shoulder determination."
  end
end


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
  attr_accessor :hit, :dl, :post, :google, :counts, :ref

  def initialize(h = nil)
    @hit = @dl = @google = @post = 0
    h.nil? and return
    h.each { |k,v|
      if k == 'hit' || k == :hit
        @hit = v
      elsif k == 'dl' || k == :dl
        @dl = v
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
    text.encode!('UTF-8', 'binary', invalid: :replace, undef: :replace, replace: '')
    # Process line by line
    text.split("\n").each { |line|
      yield line
    }
  else
    File.open(path, "r") { |io|
      io.each_line { |line|
        yield line
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
    # Fieldspec for CloudFront logs v 1.0:
    # #Fields: date time x-edge-location sc-bytes c-ip cs-method cs(Host) cs-uri-stem sc-status cs(Referer)
    #          cs(User-Agent) cs-uri-query cs(Cookie) x-edge-result-type x-edge-request-id x-host-header
    #          cs-protocol cs-bytes time-taken x-forwarded-for ssl-protocol ssl-cipher x-edge-response-result-type
    #          cs-protocol-version
    o_time     = 1
    o_ip       = 4
    o_method   = 5
    o_uriStem  = 7
    o_status   = 8
    o_referrer = 9
    o_agent    = 10
    o_query    = 11

    nLines = 0
    eachLogLine(@path) { |line|
      nLines += 1
      if nLines == 1
        line =~ /Version: 1\.0/ or raise("expecting v 1.0 CloudFront log in #{path.inspect}")
        next
      elsif nLines == 2
        fieldSpec = line.split()[1,999]
        fieldSpec.length == 24 or raise("unexpected fieldspec for v 1.0 CloudFront log")
      else
        next unless line.include?("GET") && (line.include?("uc/item") || line.include?("content"))
        values = line.split
        yield LogEvent.new(values[o_ip],
                           parseTime(@date, values[o_time], true), # isGmt: true
                           values[o_method],
                           values[o_query] == '-' ? values[o_uriStem] : values[o_uriStem]+'?'+values[o_query],
                           values[o_status].to_i,
                           values[o_referrer] == '-' ? nil : URI.unescape(URI.unescape(values[o_referrer])),
                           values[o_agent] == '-' ? nil : URI.unescape(URI.unescape(values[o_agent])),
                           nil)  # no trace ID
      end
    }
  end
end

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
    # e.g. http 2017-10-20T08:45:42.008160Z app/pub-jschol-prd-alb/683d40c2feb7aa9f 103.74.214.12:48333 172.30.5.176:18880
    #      0.000 0.001 0.000 200 200 593 6659 "GET http://escholarship.org:80/images/temp_article.png HTTP/1.1"
    #      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML) Chrome/61.0.3163.100 Safari/537.36"
    #      - - arn:aws:elasticloadbalancing:us-west-2:451826914157:targetgroup/pub-jschol-prd-tg/a1d8bd825b060349
    #      "Root=1-59e9b7b6-3d8e3a1e37b49d7a150d6901" "-" "-"
    # See http://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-access-logs.html
    linePat = %r{^   (?<type>                     [^ ]+      ) \s
                     (?<timestamp>                [-\dT:.Z]+ ) \s
                     (?<elb>                      [^ ]+      ) \s
                     (?<client_port>              [^ ]+      ) \s
                     (?<target_port>              [^ ]+      ) \s
                     (?<request_processing_time>  [^ ]+      ) \s
                     (?<target_processing_time>   [^ ]+      ) \s
                     (?<response_processing_time> [^ ]+      ) \s
                     (?<elb_status_code>          [-\d]+     ) \s
                     (?<target_status_code>       [-\d]+     ) \s
                     (?<received_bytes>           [^ ]+      ) \s
                     (?<sent_bytes>               [^ ]+      ) \s
                   " (?<request>                  [^"]+      ) " \s
                   " (?<user_agent>               [^"]*      ) " \s
                     (?<ssl_cipher>               [^ ]+      ) \s
                     (?<ssl_protocol>             [^ ]+      ) \s
                     (?<target_group_arn>         [^ ]+      ) \s
                   " (?<trace_id>                 [^ ]+      ) " \s
                     (?<domain_name>              [^ "]+|"[^"]+" ) \s
                     (?<chosen_cert_arn>          [^ "]+|"[^"]+" )
                $}x

    portPat = %r{^ (?<ip>   \d+\.\d+\.\d+\.\d+) :
                   (?<port> \d+)
                $}x

    reqPat = %r{^ (?<method>   [-A-Z]+) \s
                  (?<protocol> [^/]+) ://
                  (?<host>     [^/:]+)
                  (: (?<port>  \d+))?
                  (?<path>     .*) \s
                  (?<proto2>   [A-Z]+/[\d.]+)
              $}x
    eachLogLine(@path) { |line|
      next unless line.include?("GET") && (line.include?("uc/item/") || line.include?("content/"))
      m1 = line.match(linePat) or raise("can't parse ALB line #{line.inspect}")
      m2 = m1[:client_port].match(portPat) or raise
      next if m1[:request] =~ /:\d+-/  # e.g. weird things like: "- http://pub-jschol-prd-alb-blah.amazonaws.com:80- "
      m3 = m1[:request].match(reqPat) or raise("can't match request #{m1[:request].inspect}")
      yield LogEvent.new(m2[:ip],
                         Time.parse(m1[:timestamp]).localtime,
                         m3[:method],
                         m3[:path],
                         m1[:elb_status_code].to_i,
                         nil,   # unfortunately, have to use trace to link referrer from jschol logs
                         m1[:user_agent] == '-' ? nil : m1[:user_agent],
                         m1[:trace_id])
    }
  end
end

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
    # e.g. [4] 157.55.39.165 - - [18/Dec/2017:00:00:02 -0800] "GET /search/?q=Kabeer,%20Naila HTTP/1.1"
    #      200 - 0.7414 - "Root=1-5a377581-76cf406644dc717f3fd2ecbb"
    linePat = %r{\[ (?<thread>    \d+       ) \] \s
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
    reqPat = %r{^ (?<method>   [A-Z]+ ) \s
                  (?<path>     .*     ) \s
                  (?<proto2>   [A-Z]+/[\d.]+)
              $}x
    eachLogLine(@path) { |line|
      next unless line.include?("GET") && (line.include?("uc/item/") || line.include?("content/"))
      m1 = line.match(linePat)
      if !m1
        if line =~ /\[\d+\] \d+\.\d+\.\d+\.\d+/
          puts "Warning: skipping #{line.inspect}"
        end
        next  # lots of other kinds of lines come out of jschol; ignore them
      end
      m2 = m1[:request].match(reqPat) or raise("can't match request #{m1[:request].inspect}")
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
  unconnectedAuthors.each { |auth|
    DB.transaction {
      authAttrs = JSON.parse(auth.attrs)
      email = authAttrs["email"].downcase
      person = emailToPerson[email]
      (nDone % 1000) == 0 and puts "Connecting authors: #{nDone} / #{nTodo}"
      if !person
        person = createPersonArk(authAttrs["name"] || "unknown", email)
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
# Calculate the hash of units for each item
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

  puts "Estimating work."
  # Make sure all authors are connected to people
  connectAuthors

  # Determine the size of each month, for time estimation during processing
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
def propagateItemMonth(itemUnits, itemPeople, itemCategory, monthPosts, month)
  puts "Propagating month #{month}."

  # We will accumulate data into these hashes
  itemStats     = Hash.new { |h,k| h[k] = EventAccum.new }
  unitStats     = Hash.new { |h,k| h[k] = EventAccum.new }
  personStats   = Hash.new { |h,k| h[k] = EventAccum.new }
  categoryStats = Hash.new { |h,k| h[k] = EventAccum.new }

  # First handle item postings for this month
  (monthPosts || []).each { |item|
    itemStats[item].incPost
    itemUnits[item].each { |unit| unitStats[unit].incPost }
    itemPeople[item] and itemPeople[item].each { |pp| personStats[pp].incPost }
    categoryStats[itemCategory[item] || 'unknown'].incPost
  }

  # Next accumulate events for each items accessed this month
  startDate = Date.new(month/100, month%100, 1)
  endDate   = startDate >> 1  # cool obscure operator that adds one month to a date
  ItemEvent.where{date >= startDate}.where{date < endDate}.each { |event|
    accum = EventAccum.new(JSON.parse(event.attrs))
    item = event.item_id
    itemStats[item].add(accum)
    cat = itemCategory[item] || 'unknown'
    itemUnits[item].each { |unit|
      unitStats[unit].add(accum)
      categoryStats[[unit, cat]].add(accum)
    }
    itemPeople[item] and itemPeople[item].each { |pp| personStats[pp].add(accum) }
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

    PersonStat.where(month: month).delete
    personStats.each { |person, accum|
      PersonStat.create(person_id: person, month: month, attrs: accum.to_h.to_json)
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

def calcStats
  calcStatsMonths

  puts "Gathering item categories."
  itemCategory = gatherItemCategories

  puts "Gathering item-person associations."
  itemPeople = ItemAuthor.where(Sequel.~(person_id: nil)).select_hash_groups(:item_id, :person_id)

  puts "Gathering item-unit associations."
  itemUnits = UnitItem.select_hash_groups(:item_id, :unit_id)
  # Attribute all items without a unit directly to root
  DB.fetch("SELECT id FROM items WHERE id NOT IN (SELECT item_id FROM unit_items)").each { |row|
    itemUnits[row[:id]] = [ 'root' ]
  }

  puts "Gathering item posting dates."
  monthPosts = Hash.new { |h,k| h[k] = [] }
  # Omit non-published and suppress-content items from posting counts.
  # NOTE: These numbers differ slightly from old (eschol4) stats because our new code converter
  #       (based on normalization stylesheets) has better date calulation for ETDs (using the
  #       history.xml file instead of timestamp on meta).
  Item.where(status: 'published').
       where(Sequel.lit("attrs->'$.suppress_content' is null")).
       select_map([:id, :attrs]).each { |item, attrStr|
    attrStr.nil? and raise("item #{item} has null attrs")
    sdate = JSON.parse(attrStr)["submission_date"]
    sdate.nil? and raise("item #{item} missing submission_date")
    sdate = parseDate(sdate)
    monthPosts[sdate.year*100 + sdate.month] << item
  }

  # Propagate all months that need it
  startTime = Time.now
  months = StatsMonth.order(:month).all.select { |sm| sm.cur_digest != sm.old_digest }
  totalCount = doneCount = 0
  months.each { |sm| totalCount += sm.cur_count }
  months.each { |sm|
    propagateItemMonth(itemUnits, itemPeople, itemCategory, monthPosts[sm.month], sm.month)
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

  puts "Done."
end

###################################################################################################
# Grab logs from their various places and put them into our 'awsLogs' directory
def grabLogs
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
  if found
    return $robotChecked[agent] = found
  end

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
              after.include?("nosplash") ? { hit: 1 } :  # this is the pdf.js viewer
                                           { hit: 1, dl: 1 }
    end
  elsif event.path =~ %r{(/dist/prd)?/content/(qt\w{8})/supp/(.+)}
    # Supp file downloads
    cf, ark, after = $1, $2, $3
    attrs = { hit: 1, supp: 1 }
  elsif event.path =~ %r{/uc/item/(\w{8})(.*)}
    # Normal item views
    miniArk, after = $1, $2
    ark = "qt#{miniArk}"
    attrs = { hit: 1 }
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
def parseDateLogs(date, sources)
  puts "Parsing logs from #{date.iso8601}."
  startTime = Time.now

  albLinks = {}
  sessionCounts = Hash.new { |h,k| h[k] = 0 }
  itemSessions  = Hash.new { |h,k| h[k] = {} }

  totalReq = 0
  robotReq = 0
  linkedRef = 0

  prevSrc = nil
  sources.each { |source|
    if source.srcName != prevSrc
      puts "Source: #{source.srcName}"
      prevSrc = source.srcName
    end
    source.eachEvent { |event|
      item, attrs, isRobot = identifyEvent(source.srcName, event)
      if !attrs
        #puts "  skip: #{source.srcName} #{item} #{event}"
        #puts
        next
      end

      # Count em up
      totalReq += 1
      if isRobot
        #puts "robot: #{event}"
        robotReq += 1
        next
      end

      #puts "#{attrs}: #{source.srcName} #{event}"
      #puts

      # Ascribe requests for redirected items to their target
      item = getFinalItem(item)

      # Ignore requests for an item after it is withdrawn
      itemInfo = getItemInfo(item)
      if !itemInfo
        #puts "Skipping event for invalid item #{item}."
        next
      end
      wdlDate = itemInfo[:withdrawn_date]
      if wdlDate && date > wdlDate
        #puts "Skipping post-withdrawal event for item #{item} withdrawn on #{wdlDate}."
        next
      end

      # Ignore requests for embargoed items before the embargo expires.
      embDate = itemInfo[:embargo_date]
      if embDate && date < embDate
        #puts "Skipping pre-embargo event for item #{item}, embargoed until #{embDate}."
        next
      end

      # We use jschol events *only* to connect referrers to ALB events
      if source.srcName == "jschol"
        if event.trace && albLinks[event.trace] && event.referrer
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

      session = [event.ip, event.agent]
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
    }
  }

  # Identify aberrant sessions, using a very simple heuristic. See, real users just don't
  # access 50 papers a day. Or, only a few do, which we will mistakenly remove, but we're
  # undoubtedly also mistakenly letting through some stealth robots, so hopefully it
  # balances out.
  aberrantSessions = Set.new
  sessionCounts.each { |session, count|
    count > 50 and aberrantSessions << session
  }

  puts "Robot req: #{robotReq}/#{totalReq} (#{sprintf("%.1f", robotReq * 100.0 / totalReq)}%)"
  puts "Linked refs: #{linkedRef}"

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

  puts "Writing finalCounts.out"
  open("finalCounts.out", "w") { |io|
    finalAccum.each { |key, accum|
      item, time, loc = key
      io.puts("#{item}|#{sprintf("%06d",time)}|#{sprintf("%-6s",loc)}|#{accum.to_h.to_s}")
    }
    puts "Aber filtered: #{aberFiltered}/#{totalHits}"
  }

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

###################################################################################################
# The main routine

#grabLogs
loadItemInfoCache
parseLogs
#calcStats
puts "Done."