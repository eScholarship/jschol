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

def aws_encode(params)
  fq = ""
  ['peer_reviewed', 'content_types', 'rights', 'units', 'disciplines'].each do |field_type|
    if params[field_type] then fq = fq + "#{field_type}: '#{params[field_type]}'" end
  end

  aws_params = {
    'q' => params['q'] ? params['q'] : 'test',
    'size' => params['size'] ? params['size'] : 10,
    
    'facet.peer_reviewed' => "{sort: 'count', size: 2}",
    'facet.content_types' => "{sort: 'count', size: 100}",
    'facet.rights' => "{sort: 'count', size: 100}",
    'facet.units' => "{sort: 'count', size: 100}",
    'facet.disciplines' => "{sort: 'count', size: 100}",
  }
  
  if fq != "" then aws_params['fq'] = fq end
  
  aws_params = URI::encode_www_form(aws_params)
end

def facet_secondary_query(params, field_type)
  params.delete(field_type)
  url = AWS_URL.clone
  url.query = aws_encode(params)
  response = JSON.parse(Net::HTTP.get(url))
  return response['facets'][field_type]
end

def search(params)
  pp params
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
        itemHash[:authors] = itemAuthors.map { |author| author.attrs }
      
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
  
  facets = response['facets']
  ['peer_reviewed', 'content_types', 'rights', 'units', 'disciplines'].each do |field_type|
    if params.key?(field_type) then facets[field_type] = facet_secondary_query(params.clone, field_type) end
  end

  return {'searchResults' => searchResults, 'facets' => facets}
end