#!/usr/bin/env ruby

# This script updates the CloudSearch index schema.

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'aws-sdk-cloudsearch'

# Run from the right directory (the parent of the tools dir)
Dir.chdir(File.dirname(File.expand_path(File.dirname(__FILE__))))

analysis_schemes = [
 { analysis_scheme_name: "no_stemming_20180829",
   analysis_options: {
     algorithmic_stemming: "none",
     stopwords: "['a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there', 'these', 'they', 'this', 'to', 'was', 'will', 'with']" },
   analysis_scheme_language: "en" } ]

###################################################################################################
# Here are all the field definitions for the jschol CloudSearch domain
fields = [
  { index_field_name: "abstract",    index_field_type:      "text",
                                     text_options:          { return_enabled:    false,
                                                              highlight_enabled: true,
                                                              sort_enabled:      false } },
  { index_field_name: "authors",     index_field_type:      "text-array",
                                     text_array_options:    { analysis_scheme: "no_stemming_20180829",
                                                              return_enabled:    false,
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
respF = cloudSearch.describe_index_fields(domain_name: csDomain)
oldFields = {}
respF.index_fields.each { |fs|
  oldFields[fs.options.index_field_name] = fs.options.to_h
}

# Do same for analysis schemes
respA = cloudSearch.describe_analysis_schemes(domain_name: csDomain)
oldASchemes = {}
respA.analysis_schemes.each { |as|
  oldASchemes[as.options.analysis_scheme_name] = as.options.to_h
}

# Make a similar hash of the field definitions we want
newFields = {}
fields.each { |f|
  newFields[f[:index_field_name]] = f
}
# and for analysis schemes
newASchemes = {}
analysis_schemes.each { |f|
  newASchemes[f[:analysis_scheme_name]] = f
}

# Correlate the existing fields with desired fields, and build a list of changes to make.
fieldUpdates = []
fieldRemovals = []
Set.new(oldFields.keys + newFields.keys).each { |fieldName|
  if fieldsEqual(oldFields[fieldName], newFields[fieldName], fieldName)
    #puts " ==> Unchanged."
  elsif newFields[fieldName]
    fieldUpdates << newFields[fieldName]
  else
    puts "  field #{fieldName.inspect}: removing."
    fieldRemovals << fieldName
  end
}

# Do same for analysis schemes
aSchemeUpdates = []
aSchemeRemovals = []
Set.new(oldASchemes.keys + newASchemes.keys).each { |asName|
  if fieldsEqual(oldASchemes[asName], newASchemes[asName], asName)
    # puts " ==> Analysis Schemes Unchanged."
  elsif newASchemes[asName]
    aSchemeUpdates << newASchemes[asName]
  else
    puts "  analysis scheme #{asName.inspect}: removing."
    aSchemeRemovals << asName
  end
}

# Make sure user is okay with proceeding.
if (fieldUpdates + fieldRemovals + aSchemeUpdates + aSchemeRemovals).empty?
  puts "Nothing to do."
  exit 0
else
  print "\nReady to proceed? "
  STDOUT.flush
  STDIN.readline.upcase =~ /^Y/ or exit 1
end

# Perform all the analysis scheme updates
if !aSchemeUpdates.empty?
  puts "Processing analysis scheme updates."
  aSchemeUpdates.each { |asData|
    puts "  Analysis Scheme #{asData[:analysis_scheme_name].inspect}"
    cloudSearch.define_analysis_scheme(domain_name: csDomain, analysis_scheme: asData)
  }
end

# Perform all the analysis scheme removals
if !aSchemeRemovals.empty?
  puts "Processing analysis scheme removals."
  aSchemeRemovals.each { |asName|
    puts "  Analysis Scheme #{asName.inspect}"
    cloudSearch.delete_analysis_scheme(domain_name: csDomain, analysis_scheme_name: asName)
  }
end

# Perform all the fieldUpdates
if !fieldUpdates.empty?
  puts "Processing field updates."
  fieldUpdates.each { |fieldData|
    puts "  Field #{fieldData[:index_field_name].inspect}"
    cloudSearch.define_index_field(domain_name: csDomain, index_field: fieldData)
  }
end

# Perform all the fieldRemovals
if !fieldRemovals.empty?
  puts "Processing field removals."
  fieldRemovals.each { |fieldName|
    puts "  Field #{fieldName.inspect}"
    cloudSearch.delete_index_field(domain_name: csDomain, index_field_name: fieldName)
  }
end

puts "Triggering re-index."
cloudSearch.index_documents(domain_name: csDomain)

puts "Done."
