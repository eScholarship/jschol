#!/usr/bin/env ruby

# This script updates the CloudSearch index schema.

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'aws-sdk'
require 'pp'

#cloudSearch = Aws::CloudSearch::Client.new(
#  region: "us-west-2", 
#  http_wire_trace: true,
#  endpoint: "http://search-cs-pub-jschol-dev-yjrblyxb6sgblwa72epljvuyci.us-west-2.cloudsearch.amazonaws.com")
#pp cloudSearch.list_domain_names
#pp cloudSearch.describe_index_fields

domain = Aws::CloudSearchDomain::Client.new(
  http_wire_trace: true,
  endpoint: "http://search-cs-pub-jschol-dev-yjrblyxb6sgblwa72epljvuyci.us-west-2.cloudsearch.amazonaws.com")
pp domain.search(query: "china")