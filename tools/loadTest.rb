#!/usr/bin/env ruby

# Load test striking a balance between simplicity and realism.

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'httparty'

class LoadTest
  def initialize(logFilePath)
    @logFile = File.open(logFilePath, "rb")
    @logFileSize = @logFile.size
    @rng = Random.new(1); puts "FIXME: use non-fixed seed"
    @subs = nil
    @lastItem = nil
    reseek
  end

  def reseek
    @logFile.seek(@rng.rand(@logFileSize))
  end

  def getItem(shortArk)
    puts "getItem #{shortArk.inspect}\n\n"
    @subs = []
    @lastItem = shortArk
    true
  end

  def getSubfiles()
    @subs.nil? and return
    puts "getSubfiles\n\n"
    @subs = nil
    true
  end

  def getItemUnsplashed(shortArk)
    return if shortArk != @lastItem
    puts "getItemUnsplashed #{shortArk.inspect}\n\n"
    @lastItem = nil
    true
  end

  def getItemSplashed(shortArk)
    puts "getItemSplashed #{shortArk.inspect}\n\n"
    true
  end

  def getUnit(unit)
    puts "getUnit #{unit.inspect}\n\n"
    @subs = []
    true
  end

  def getSearch(keyword)
    puts "getSearch #{keyword.inspect}\n\n"
    @subs = []
    true
  end

  def getHomepage
    puts "getHomepage\n\n"
    @subs = []
  end

  def go
    steps = 1000
    while steps > 0
      line = @logFile.readline
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
        did = getSubfiles

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
end

# Main
test = LoadTest.new(ARGV[0])
test.go