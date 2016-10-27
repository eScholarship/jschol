#!/usr/bin/env ruby

# This script shows the status of our CloudSearch domain.

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'aws-sdk'
require 'pp'
require 'yaml'


###################################################################################################
# The main action begins here

# Connect to CloudSearch
csDomain = YAML.load_file("config/cloudSearch.yaml")["domain"]

puts "Domain #{csDomain.inspect}:"
csClient = Aws::CloudSearch::Client.new(region: "us-west-2")
data = csClient.describe_domains(domain_names: [csDomain]).domain_status_list[0]
puts "  #{data.processing ? "Processing" : "Active"}"

domainClient = Aws::CloudSearchDomain::Client.new(
  endpoint: YAML.load_file("config/cloudSearch.yaml")["searchEndpoint"])
data = domainClient.search(query: "matchall", query_parser: "structured", size: 0)
puts "  #{data.hits.found} documents in index."