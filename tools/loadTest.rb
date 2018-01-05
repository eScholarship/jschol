#!/usr/bin/env ruby

# Load test striking a balance between simplicity and realism.

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'httparty'

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

# Need a key for encrypting login credentials and URL keys
$jscholKey = ENV['JSCHOL_KEY'] or raise("missing env JSCHOL_KEY")

$nextThreadNum = 0

###################################################################################################
def calcContentKey(shortArk, date = nil)
  Digest::MD5.hexdigest("V01:#{shortArk}:#{(date || Date.today).iso8601}:#{$jscholKey}")
end

RATE = 500000
ABORT_PCT = 5

###################################################################################################
class LoadTest
  def initialize(logFilePath)
    @logFile = File.open(logFilePath, "rb")
    @logFileSize = @logFile.size
    @rng = Random.new
    @subs = nil
    @lastItem = nil
    reseek
  end

  def reseek
    @logFile.seek(@rng.rand(@logFileSize))
  end

  def fetch(path)
    url = "#{$baseURL}/#{path.sub(%r{^/},'')}"
    puts "fetch #{url}"
    begin
      body = []
      resp = HTTParty.get(url) do |fragment|
        body << fragment
        ABORT_PCT && Random.rand(100) < ABORT_PCT and raise "aborting early"
        RATE && !fragment.empty? and sleep(fragment.length / RATE)
      end
      if resp.code.to_i == 404 && url.include?("/supp/")
        url.sub!("/supp/", "/inner/")
        puts "  refetch #{url}"
        resp = HTTParty.get(url) do |fragment|
          body << fragment
          ABORT_PCT && Random.rand(100) < ABORT_PCT and raise "aborting early"
          RATE && !fragment.empty? and sleep(fragment.length / RATE)
        end
      end
      if resp.code.to_i != 200
        puts "Warning: HTTP #{resp.code} for #{url}"
        return ""
      end
      return body.join("")
    rescue Exception => e
      if e.to_s =~ /aborting early/
        puts "Early abort."
      else
        puts "Exception in fetch: #{e}"
      end
      return ""
    end
  end

  def fetchPage(path)
    body = fetch(path)
    @subs = (body.scan(%r{<link [^>]*href="([^"]+)"}) +
             body.scan(%r{<\w+ [^>]*src="([^"]+)"})).flatten.uniq
    return body
  end

  def getItem(shortArk)
    puts "getItem #{shortArk.inspect}"
    fetchPage "/uc/item/#{shortArk}"
    @lastItem = shortArk
    true
  end

  def getSubfiles()
    @subs.nil? and return
    puts "getSubfiles"
    @subs.each { |sub| fetch(sub) }
    @subs = nil
    true
  end

  def getItemUnsplashed(shortArk)
    return if shortArk != @lastItem
    puts "getItemUnsplashed #{shortArk.inspect}"
    fetch "/content/qt#{shortArk}/qt#{shortArk}.pdf?nosplash=#{calcContentKey(shortArk)}"
    @lastItem = nil
    true
  end

  def getItemSplashed(shortArk)
    puts "getItemSplashed #{shortArk.inspect}"
    fetch "/content/qt#{shortArk}/qt#{shortArk}.pdf"
    true
  end

  def getSupp(shortArk, filename)
    puts "getSupp #{shortArk.inspect}, #{filename.inspect}"
    fetch "/content/qt#{shortArk}/supp/#{filename}"
    true
  end

  def getUnit(unit)
    puts "getUnit #{unit.inspect}"
    fetchPage "/uc/#{unit}"
    true
  end

  def getSearch(keyword)
    puts "getSearch #{keyword.inspect}"
    fetchPage "/uc/search?q=#{keyword}"
    true
  end

  def getHomepage
    puts "getHomepage"
    fetchPage "/"
  end

  def go
    steps = 1000
    while steps > 0
      begin
        line = @logFile.readline
      rescue EOFError
        reseek
        next
      end
      #puts line
      if line =~ %r{GET /uc/item/(\w{8}) }
        did = getItem($1)
      elsif line =~ %r{GET /uc/item/(\w{8})\?image\.view}
        did = getItemUnsplashed($1)
      elsif line =~ %r{GET /uc/item/(\w{8})\.pdf}
        did = getItemSplashed($1)
      elsif line =~ %r{ "http[^"]+/uc/item/(\w{8})}
        did = getSubfiles
      elsif line =~ %r{GET /uc/item/(\w{8})/([^.;&]+\.\w+)}
        did = getSupp($1, $2)

      elsif line =~ %r{GET /uc/search\?entity=([^ ;&]+)}
        did = getUnit($1)
      elsif line =~ %r{GET /uc/(?!item|search)([^ ;&]+)[? ]}
        did = getUnit($1)
      elsif line =~ %r{ "http[^"]+/uc/(?!item|search)([^ ;&"]+)}
        did = getSubfiles
      elsif line =~ %r{ "http[^"]+/uc/search\?entity=([^ ;&"]+)}
        did = getSubfiles

      elsif line =~ %r{GET /uc/search[^ ]*smode}
        # skip
      elsif line =~ %r{GET /uc/search\?keyword=([^; ]+)}
        did = getSearch($1)
      elsif line =~ %r{ "http[^"]+/uc/search\?keyword=([^; "]+)}
        did = getSubfiles

      elsif line =~ %r{GET / }
        did = getHomepage
      elsif line =~ %r{ "https?://(www\.)?escholarship.org/"}
        did = getSubfiles

      elsif line =~ %r{ "http[^"]+/(combined|eScholarship\.css)}
        # skip
      elsif line =~ %r{"GET [^ ]*favicon}
        # skip

      else
        #puts "nomatch: #{line}"
        did = false
      end
      did and steps -= 1
    end
  end

  def run
    Thread.new {
      begin
        Thread.current[:name] = ($nextThreadNum += 1).to_s
        while true
          go
          reseek
        end
      rescue Exception => e
        puts "Uncaught exception! #{e} #{e.backtrace}"
        exit 1
      end
    }
  end
end

###################################################################################################
# Main
nThreads = ARGV[0]
$baseURL = ARGV[1]
allThreads = []
nThreads.to_i.times {
  test = LoadTest.new(ARGV[2])
  test.run
}
while true
  sleep 100
end
