#!/usr/bin/env ruby

# This script updates the CloudSearch index schema.

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'aws-sdk'
require 'pp'

# Run from the right directory (the parent of the tools dir)
Dir.chdir(File.dirname(File.expand_path(File.dirname(__FILE__))))

###################################################################################################
# Here are all the field definitions for the jschol CloudSearch domain
fields = [
  { index_field_name: "abstract",    index_field_type:      "text",
                                     text_options:          { return_enabled:    false,
                                                              highlight_enabled: true,
                                                              sort_enabled:      false } },
  { index_field_name: "authors",     index_field_type:      "text-array",
                                     text_array_options:    { return_enabled:    false,
                                                              highlight_enabled: true } },
  { index_field_name: "campuses",    index_field_type:      "literal-array",
                                     literal_array_options: { return_enabled:    false,
                                                              search_enabled:    true,
                                                              facet_enabled:     true } },
  { index_field_name: "departments", index_field_type:      "literal-array",
                                     literal_array_options: { return_enabled:    false,
                                                              search_enabled:    true,
                                                              facet_enabled:     true } },
  { index_field_name: "disciplines", index_field_type:      "literal-array",
                                     literal_array_options: { return_enabled:    false,
                                                              search_enabled:    true,
                                                              facet_enabled:     true } },
  { index_field_name: "is_info",     index_field_type:      "int",
                                     int_options:           { return_enabled:    false,
                                                              search_enabled:    true,
                                                              facet_enabled:     false,
                                                              sort_enabled:      false } },
  { index_field_name: "journals",    index_field_type:      "literal-array",
                                     literal_array_options: { return_enabled:    false,
                                                              search_enabled:    true,
                                                              facet_enabled:     true } },
  { index_field_name: "keywords",    index_field_type:      "text-array",
                                     text_array_options:    { return_enabled:    false,
                                                              highlight_enabled: false } },
  { index_field_name: "peer_reviewed", index_field_type:    "int",
                                     int_options:           { return_enabled:    false,
                                                              search_enabled:    true,
                                                              facet_enabled:     true,
                                                              sort_enabled:      false } },
  { index_field_name: "pub_date",    index_field_type:      "date",
                                     date_options:          { return_enabled:    false,
                                                              search_enabled:    true,
                                                              sort_enabled:      true,
                                                              facet_enabled:     false } },
  { index_field_name: "pub_year",    index_field_type:      "int",
                                     int_options:           { return_enabled:    true,
                                                              search_enabled:    true,
                                                              facet_enabled:     true,
                                                              sort_enabled:      false } },
  { index_field_name: "rights",      index_field_type:      "literal",
                                     literal_options:       { return_enabled:    false,
                                                              search_enabled:    true,
                                                              facet_enabled:     true,
                                                              sort_enabled:      false } },
  { index_field_name: "series",      index_field_type:      "literal-array",
                                     literal_array_options: { return_enabled:    false,
                                                              search_enabled:    true,
                                                              facet_enabled:     true } },
  { index_field_name: "sort_author", index_field_type:      "literal",
                                     literal_options:       { return_enabled:    false,
                                                              sort_enabled:      true,
                                                              facet_enabled:     false,
                                                              search_enabled:    false } },
  { index_field_name: "supp_file_types", index_field_type:  "literal-array",
                                     literal_array_options: { return_enabled:    false,
                                                              search_enabled:    true,
                                                              facet_enabled:     true } },
  { index_field_name: "text",        index_field_type:      "text",
                                     text_options:          { return_enabled:    false,
                                                              sort_enabled:      false,
                                                              highlight_enabled: false } },
  { index_field_name: "title",       index_field_type:      "text",
                                     text_options:          { return_enabled:    true,
                                                              sort_enabled:      true,
                                                              highlight_enabled: true } },
  { index_field_name: "type_of_work", index_field_type:     "literal",
                                     literal_options:       { return_enabled:    false,
                                                              search_enabled:    true,
                                                              facet_enabled:     true,
                                                              sort_enabled:      false } },
]

###################################################################################################
# It's fairly tricky to compare field definitions in our table with those that
# come out of the AWS API. Here goes...
def fieldsEqual(f1, f2, path)
  if f1.nil?
    puts "  #{path}=#{f2.inspect}"
    return false
  elsif f2.nil? && path.end_with?("/analysis_scheme")
    # Ignore defaulted analysis scheme
    return true
  elsif f2.nil?
    puts "  #{path}=nil (was #{f1.inspect})"
    return false
  elsif [true, false].include?(f1) && [true, false].include?(f2)
    f1 == f2 and return true
    puts "  #{path}=#{f2.inspect} (was #{f1.inspect})"
    return false
  elsif f1.class != f2.class
    raise("Class change!? #{path}: #{f1.class} -> #{f2.class}")
  elsif f1.instance_of? Hash
    ret = true
    Set.new(f1.keys | f2.keys).each { |k|
      fieldsEqual(f1[k], f2[k], "#{path}/#{k}") or ret = false
    }
    return ret
  elsif f1 != f2
    puts "  #{path}=#{f2.inspect} (was #{f1.inspect})"
    return false
  else
    return true
  end
end

###################################################################################################
# The main action begins here

# Connect to CloudSearch
csDomain = ENV['CLOUDSEARCH_DOMAIN'] || raise("missing env CLOUDSEARCH_DOMAIN")
cloudSearch = Aws::CloudSearch::Client.new(credentials: Aws::InstanceProfileCredentials.new,
  #http_wire_trace: true,
  region: "us-west-2")
isProcessing = cloudSearch.describe_domains(domain_names: [csDomain]).domain_status_list[0].processing
if isProcessing
  puts "Domain is still processing."
  exit 1
end

# Determine the existing index field definitions, and stuff them in a hash
resp = cloudSearch.describe_index_fields(domain_name: csDomain)
oldFields = {}
resp.index_fields.each { |fs|
  oldFields[fs.options.index_field_name] = fs.options.to_h
}

# Make a similar hash of the field definitions we want
newFields = {}
fields.each { |f|
  newFields[f[:index_field_name]] = f
}

# Correlate the existing fields with desired fields, and build a list of changes to make.
updates = []
removals = []
Set.new(oldFields.keys + newFields.keys).each { |fieldName|
  if fieldsEqual(oldFields[fieldName], newFields[fieldName], fieldName)
    #puts " ==> Unchanged."
  elsif newFields[fieldName]
    updates << newFields[fieldName]
  else
    puts "  field #{fieldName.inspect}: removing."
    removals << fieldName
  end
}

# Make sure user is okay with proceeding.
if (updates + removals).empty?
  puts "Nothing to do."
  exit 0
else
  print "\nReady to proceed? "
  STDOUT.flush
  STDIN.readline.upcase =~ /^Y/ or exit 1
end

# Perform all the updates
if !updates.empty?
  puts "Processing updates."
  updates.each { |fieldData|
    puts "  Field #{fieldData[:index_field_name].inspect}"
    cloudSearch.define_index_field(domain_name: csDomain, index_field: fieldData)
  }
end

# Perform all the removals
if !removals.empty?
  puts "Processing removals."
  removals.each { |fieldName|
    puts "  Field #{fieldName.inspect}"
    cloudSearch.delete_index_field(domain_name: csDomain, index_field_name: fieldName)
  }
end

puts "Triggering re-index."
cloudSearch.index_documents(domain_name: csDomain)

puts "Done."
