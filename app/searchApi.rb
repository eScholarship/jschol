require 'aws-sdk'
require 'sequel'
require 'json'
require 'pp'

###################################################################################################
# Model classes for easy interaction with the database.
#
# For more info on the database schema, see contents of migrations/ directory, and for a more
# graphical version, see:
#
# https://docs.google.com/drawings/d/1gCi8l7qteyy06nR5Ol2vCknh9Juo-0j91VGGyeWbXqI/edit

class Unit < Sequel::Model
  unrestrict_primary_key
end

class UnitHier < Sequel::Model(:unit_hier)
  unrestrict_primary_key
end

class Item < Sequel::Model
  unrestrict_primary_key
end

class UnitItem < Sequel::Model
  unrestrict_primary_key
end

class Item < Sequel::Model
  unrestrict_primary_key
end

class ItemAuthors < Sequel::Model(:item_authors)
  unrestrict_primary_key
end

class Section < Sequel::Model
end

class Issue < Sequel::Model
end

$csClient = Aws::CloudSearchDomain::Client.new(
  endpoint: YAML.load_file("config/cloudSearch.yaml")["searchEndpoint"])

FACETS = ['type_of_work', 'peer_reviewed', 'supp_file_types', 'pub_year', 'campuses', 'departments', 'journals', 'disciplines', 'rights']

def get_query_display(params)
  filters = {}
  
  if params.key?('type_of_work')
    filters['type_of_work'] = {'display' => 'Type of Work', 'fieldName' => 'type_of_work', 'filters' => get_type_of_work_display_name(params['type_of_work'].map { |v| {'value' => v} })}
  end
  if params.key?('peer_reviewed')
    filters['peer_reviewed'] = {'display' => 'Peer Review', 'fieldName' => 'peer_reviewed', 'filters' => params['peer_reviewed'].map{ |v| {'value' => v} }}
  end
  if params.key?('supp_file_types')
    filters['supp_file_types'] = {'display' => 'Included Media', 'fieldName' => 'supp_file_types', 'filters' => capitalize_display_name(params['supp_file_types'].map{ |v| {'value' => v} })}
  end
  if params.key?('pub_year')
    filters['pub_year'] = {'display' => 'Publication Year', 'fieldName' => 'pub_year', 'filters' => params['pub_year'].map{ |v| {'value' => v} }}
  end
  if params.key?('campuses')
    filters['campuses'] = {'display' => 'Campus', 'fieldName' => 'campuses', 'filters' => get_unit_display_name(params['campuses'].map{ |v| {'value' => v} })}
  end
  if params.key?('deparments')
    filters['departments'] = {'display' => 'Department', 'fieldName' => 'departments', 'filters' => params['departments'].map{ |v| {'value' => v} }}
  end
  if params.key?('journals')
    filters['journals'] = {'display' => 'Journal', 'fieldName' => 'journals', 'filters' => get_unit_display_name(params['journals'].map{ |v| {'value' => v} })}
  end
  if params.key?('disciplines')
    filters['disciplines'] = {'display' => 'Discipline', 'fieldName' => 'disciplines', 'filters' => params['disciplines'].map{ |v| {'value' => v} }}
  end
  if params.key?('rights')
    filters['rights'] = {'display' => 'Reuse License', 'fieldName' => 'rights', 'filters' => params['rights'].map{ |v| {'value' => v} }}
  end
  
  display_params = {
    'q' => params['q'] ? params['q'].join(" ") : 'test',
    'filters' => filters
  }
end

def aws_encode(params)
  fq = []
  FACETS.each do |field_type|
    if params[field_type].length > 0
      if field_type != 'pub_year'
        filters = params[field_type].map { |filter| "#{field_type}: '#{filter}'" }
      else
        filters = params[field_type].map { |filter| "#{field_type}: #{filter}" }
      end
      filters = filters.join(" ")
      if params[field_type].length > 1 then filters = "(or #{filters})" end
      fq.push(filters)
    end
  end

  if fq.length > 1
    fq = fq.join(" ")
    fq = "(and #{fq})"
  elsif fq.length == 1
    fq = fq.join(" ")
  end

  # per message from Lisa 9/13/2016 regarding campus facets:
  #   - lbnl should be lbl (unsure if it should be LBL in the display too?)
  #   - ANR (Agriculture and Natural Resources) should be added to this list

  aws_params = {
    query: params['q'] ? params['q'].join(" ") : 'test',
    size: params['size'].length > 0 ? params['size'][0] : 10,
    
    facet: JSON.generate({
      'type_of_work' => {buckets: ['article', 'monograph', 'dissertation', 'multimedia']},
      'peer_reviewed' => {buckets: [1]},
      'supp_file_types' => {buckets: ['video', 'audio', 'images', 'zip', 'other files']},
      'campuses' => {buckets: ['ucb', 'ucd', 'uci', 'ucla', 'ucm', 'ucr', 'ucsd', 'ucsf', 'ucsb', 'ucsc', 'ucop', 'lbnl']},
      'departments' => {sort: 'count', size: 100},
      'journals' => {sort: 'count', size: 100},
      'disciplines' => {sort: 'count', size: 100},
      'rights' => {sort: 'count', size: 100}
    })
  }
  
  if fq.length > 0 then aws_params[:fq] = fq end
  
  return aws_params
end

def facet_secondary_query(params, field_type)
  params.delete(field_type)
  url = AWS_URL.clone
  url.query = aws_encode(params)
  response = JSON.parse(Net::HTTP.get(url))
  return response['facets'][field_type]
end

def get_unit_display_name(unitFacets)
  for unitFacet in unitFacets
    unit = Unit[unitFacet['value']]
    unitFacet['displayName'] = unit.name
  end
end

def get_type_of_work_display_name(facetList)
  for facet in facetList    
    if facet['value'] == 'article' then facet['displayName'] = 'Article' end
    if facet['value'] == 'monograph' then facet['displayName'] = 'Book' end
    if facet['value'] == 'dissertation' then facet['displayName'] = 'Theses' end
    if facet['value'] == 'multimedia' then facet['displayName'] = 'Multimedia' end
  end
end

def capitalize_display_name(facetList)
  for facet in facetList
    facet['displayName'] = facet['value'].capitalize
  end
end

def normalizeResponse(response)
  if response.instance_of? Array
    response.map { |v| normalizeResponse(v) }
  elsif response.respond_to?(:map)
    response.to_h.map { |k,v| [k.to_s, normalizeResponse(v)] }.to_h
  elsif response.nil? || response.is_a?(String) || response.is_a?(Integer)
    response
  else
    raise "Unexpected response type: #{response.inspect}"
  end
end

def search(params)
  aws_params = aws_encode(params)
  response = normalizeResponse($csClient.search(return: '_no_fields', **aws_params))

  searchResults = []
  if response['hits'] && response['hits']['hit']
    for indexItem in response['hits']['hit']
      item = Item[indexItem['id']]
      if item
        itemHash = {
          :id => item.id,
          :title => item.title,
          :genre => item.genre,
          :rights => item.rights,
          :content_type => item.content_type,
          :pub_date => item.pub_date
        }
      
        itemAttrs = JSON.parse(item.attrs)
        itemHash[:peerReviewed] = itemAttrs['is_peer_reviewed']
        itemHash[:abstract] = itemAttrs['abstract']
      
        itemAuthors = ItemAuthors.where(item_id: indexItem['id']).order(:ordering).all
        itemHash[:authors] = itemAuthors.map { |author| JSON.parse(author.attrs) }
      
        #if journal, section will be non-nil, follow section link to issue (get volume), follow to unit table
        #item link to the unit should be the same as section link to the unit      
        if item.section
          itemIssue = Issue[Section[item.section].issue_id]
          itemUnit = Unit[itemIssue.unit_id]
          itemHash[:journalInfo] = {displayName: "#{itemUnit.name}, #{itemIssue.volume}, #{itemIssue.issue}", issueId: itemIssue.id}
        #otherwise, use the item link to the unit table for all other content types
        else
          unitItem = UnitItem[:item_id => indexItem['id']]
          if unitItem
            unit = Unit[:id => unitItem.unit_id]
            itemHash[:unitInfo] = {displayName: unit.name, unitId: unit.id}
          end
        end
      
        searchResults << itemHash
      else
        puts 'NilClass: '
        puts indexItem['id']
      end
    end
  end
  
  facetHash = response['facets']
  FACETS.each do |field_type|
    if field_type != 'pub_year' && params.key?(field_type) 
      facetHash[field_type] = facet_secondary_query(params.clone, field_type)
    end
  end

  # put facets into an array to maintain a specific order, apply facet-specific augmentation like including display values (see journal)
  facets = [
    {'display' => 'Type of Work', 'fieldName' => 'type_of_work', 'facets' => get_type_of_work_display_name(facetHash['type_of_work']['buckets'])},
    {'display' => 'Peer Review', 'fieldName' => 'peer_reviewed', 
      'facets' => [{'value' => "1", 'count' => facetHash['peer_reviewed']['buckets'][0]['count'], 'displayName' => 'Peer-reviewed only'}] },
    {'display' => 'Included Media', 'fieldName' => 'supp_file_types', 'facets' => capitalize_display_name(facetHash['supp_file_types']['buckets'])},
    {'display' => 'Publication Year', 'fieldName' => 'pub_year'},
    {'display' => 'Campus', 'fieldName' => 'campuses', 'facets' => get_unit_display_name(facetHash['campuses']['buckets'])},
    {'display' => 'Departments', 'fieldName' => 'departments', 'facets' => facetHash['departments']['buckets']},
    {'display' => 'Journal', 'fieldName' => 'journals', 'facets' => get_unit_display_name(facetHash['journals']['buckets'])},
    {'display' => 'Discipline', 'fieldName' => 'disciplines', 'facets' => facetHash['disciplines']['buckets']},
    {'display' => 'Reuse License', 'fieldName' => 'rights', 'facets' => facetHash['rights']['buckets']}
  ]
  
  return {'count' => response['hits']['found'], 'query' => get_query_display(params.clone), 'searchResults' => searchResults, 'facets' => facets}
end