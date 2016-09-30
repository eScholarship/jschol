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

AWS_URL = URI('http://localhost:8888/2013-01-01/search')

def get_query_display(params)
  filters = {}

  if params['type_of_work']
    filters['type_of_work'] = {'display' => 'Type of Work', 'fieldName' => 'type_of_work', 'filters' => params['type_of_work']}
  end
  if params['peer_reviewed']
    filters['peer_reviewed'] = {'display' => 'Peer Review', 'fieldName' => 'peer_reviewed', 'filters' => params['peer_reviewed']}
  end
  if params['supp_file_types']
    filters['supp_file_types'] = {'display' => 'Included Media', 'fieldName' => 'supp_file_types', 'filters' => params['supp_file_types']}
  end
  if params['campuses']
    filters['campuses'] = {'display' => 'Campus', 'fieldName' => 'campuses', 'filters' => get_unit_display_name(params['campuses'].map{ |v| {'value' => v} })}
  end
  if params['journals']
    filters['journals'] = {'display' => 'Journal', 'fieldName' => 'journals', 'filters' => get_unit_display_name(params['journals'].map{ |v| {'value' => v} })}
  end
  if params['disciplines']
    filters['disciplines'] = {'display' => 'Discipline', 'fieldName' => 'disciplines', 'filters' => params['disciplines']}
  end
  if params['rights']
    filters['rights'] = {'display' => 'Reuse License', 'fieldName' => 'rights', 'filters' => params['rights']}
  end

  display_params = {
    'q' => params['q'] ? params['q'].join(" ") : 'test',
    'filters' => filters
  }
end

def aws_encode(params)
  fq = []
  ['type_of_work', 'peer_reviewed', 'supp_file_types', 'campuses', 'journals', 'disciplines', 'rights'].each do |field_type|
    if params[field_type].length > 0
      filters = params[field_type].map { |filter| "#{field_type}: '#{filter}'" }
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
    'q' => params['q'] ? params['q'].join(" ") : 'test',
    'size' => params['size'] ? params['size'] : 10,
    
    'facet.type_of_work' => "{buckets: ['article', 'book', 'theses', 'multimedia']}",
    'facet.peer_reviewed' => "{buckets: [1]}",
    'facet.supp_file_types' => "{buckets: ['video', 'audio', 'images', 'zip', 'other files']}",
    'facet.campuses' => "{buckets: ['ucb', 'ucd', 'uci', 'ucla', 'ucm', 'ucr', 'ucsd', 'ucsf', 'ucsb', 'ucsc', 'ucop', 'lbnl']}",
    'facet.journals' => "{sort: 'count', size: 100}",
    'facet.disciplines' => "{sort: 'count', size: 100}",
    'facet.rights' => "{sort: 'count', size: 100}"
  }
  
  if fq.length > 0 then aws_params['fq'] = fq end
  
  aws_params = URI::encode_www_form(aws_params)
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

def search(params)
  url = AWS_URL.clone
  url.query = aws_encode(params)
  response = JSON.parse(Net::HTTP.get(url))
  
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
  ['type_of_work', 'peer_reviewed', 'supp_file_types', 'campuses', 'journals', 'disciplines', 'rights'].each do |field_type|
    if params.key?(field_type) then facetHash[field_type] = facet_secondary_query(params.clone, field_type) end
  end

  # put facets into an array to maintain a specific order, apply facet-specific augmentation like including display values (see journal)
  facets = [
    {'display' => 'Type of Work', 'fieldName' => 'type_of_work', 'facets' => facetHash['type_of_work']['buckets']},
    {'display' => 'Peer Review', 'fieldName' => 'peer_reviewed', 'facets' => facetHash['peer_reviewed']['buckets']},
    {'display' => 'Included Media', 'fieldName' => 'supp_file_types', 'facets' => facetHash['supp_file_types']['buckets']},
    {'display' => 'Campus', 'fieldName' => 'campuses', 'facets' => get_unit_display_name(facetHash['campuses']['buckets'])},
    {'display' => 'Journal', 'fieldName' => 'journals', 'facets' => get_unit_display_name(facetHash['journals']['buckets'])},
    {'display' => 'Discipline', 'fieldName' => 'disciplines', 'facets' => facetHash['disciplines']['buckets']},
    {'display' => 'Reuse License', 'fieldName' => 'rights', 'facets' => facetHash['rights']['buckets']}
  ]
  
  return {'count' => response['hits']['found'], 'query' => get_query_display(params.clone), 'searchResults' => searchResults, 'facets' => facets}
end