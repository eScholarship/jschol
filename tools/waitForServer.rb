#!/usr/bin/env ruby

require 'net/http'
require 'uri'

ARGV.length == 2 or fail("Usage: #{$0} url seconds")
uri = URI(ARGV[0])
timeout = ARGV[1].to_i

messagePrinted = false
startTime = Time.now
begin
  response = Net::HTTP.get_response(uri)
  response.code == "200" or raise Exception.new("#{response}: #{response.body}")
rescue Exception => res
  if Time.now - startTime < timeout
    if !messagePrinted
      puts "Waiting for #{uri} to be resolve."
      messagePrinted = true
    end
    sleep 1; retry
  end
  puts "#{uri} still not responding after #{timeout} seconds; giving up."
  exit 1
end