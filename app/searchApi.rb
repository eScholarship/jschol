require 'aws-sdk'
require 'sequel'
require 'json'
require 'pp'

# API to connect to AWS CloudSearch
$csClient = Aws::CloudSearchDomain::Client.new(
  endpoint: YAML.load_file("config/cloudSearch.yaml")["searchEndpoint"])

FACETS = ['type_of_work', 'peer_reviewed', 'supp_file_types', 'pub_year', 'campuses', 'departments', 'journals', 'disciplines', 'rights']

def encode_sort(sortorder)
  if sortorder == 'rel'
    return '_score desc'
  elsif sortorder == 'pop'
    return '_score desc'
  elsif sortorder == 'a-title'
    return 'title asc'
  elsif sortorder == 'z-title'
    return 'title desc'
  elsif sortorder == 'a-author'
    return 'sort_author asc'
  elsif sortorder == 'z-author'
    return 'sort_author desc'
  elsif sortorder == 'asc'
    return 'pub_date asc'
  elsif sortorder == 'desc'
    return 'pub_date desc'
  else
    return '_score desc'
  end
end

# TODO: figure out how get_query_display works for pub_year_start and pub_year_end
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
    filters['pub_year'] = {'display' => 'Publication Year', 'fieldName' => 'pub_year', 'input' => parse_range(params['pub_year'])}
  end
  if params.key?('campuses')
    filters['campuses'] = {'display' => 'Campus', 'fieldName' => 'campuses', 'filters' => get_unit_display_name(params['campuses'].map{ |v| {'value' => v} })}
  end
  if params.key?('departments')
    filters['departments'] = {'display' => 'Department', 'fieldName' => 'departments', 'filters' => get_unit_display_name(params['departments'].map{ |v| {'value' => v} })}
  end
  if params.key?('journals')
    filters['journals'] = {'display' => 'Journal', 'fieldName' => 'journals', 'filters' => get_unit_display_name(params['journals'].map{ |v| {'value' => v} })}
  end
  if params.key?('disciplines')
    filters['disciplines'] = {'display' => 'Discipline', 'fieldName' => 'disciplines', 'filters' => params['disciplines'].map{ |v| {'value' => v} }}
  end
  if params.key?('rights')
    filters['rights'] = {'display' => 'Reuse License', 'fieldName' => 'rights', 'filters' => params['rights'].map{ |v| if v == 'public' then {'value' => v, 'displayName' => 'Public'} else {'value' => v} end }}
  end

  if params.key?('pub_year_start') and params.key?('pub_year_end')
    filters['pub_year'] = {'display' => 'Publication Year', 'fieldName' => 'pub_year', 'filters' => [{'value' => "#{params['pub_year_start'][0]}-#{params['pub_year_end'][0]}"}]}
  elsif params.key?('pub_year_start')
    filters['pub_year'] = {'display' => 'Publication Year', 'fieldName' => 'pub_year', 'filters' => [{'value' => params['pub_year_start'][0] }]}
  elsif params.key?('pub_year_end')
    filters['pub_year'] = {'display' => 'Publication Year', 'fieldName' => 'pub_year', 'filters' => [{'value' => params['pub_year_end'][0] }]}
  end
  
  display_params = {
    'q' => params['q'] ? params['q'].join(" ") : 'test',
    'rows' => params['rows'].length > 0 ? params['rows'][0] : '10',
    'sort' => params['sort'].length > 0 ? params['sort'][0] : 'rel',
    'start' => params['start'].length > 0 ? params['start'][0] : '0',
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
  
  if (params['pub_year_start'].length > 0 || params['pub_year_end'].length > 0) && 
    (params['pub_year_start'][0] != "" || params['pub_year_end'][0] != "")
    
    if params['pub_year_start'].length > 0 && params['pub_year_start'][0] != ""
      date_range = "[#{params['pub_year_start'][0]},"
    else
      date_range = "{,"
    end
    
    if params['pub_year_end'].length > 0 && params['pub_year_end'][0] != ""
      date_range = "#{date_range}#{params['pub_year_end'][0]}]"
    else
      date_range = "#{date_range}}"
    end
    
    fq.push("pub_year: #{date_range}")
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
    size: params['rows'].length > 0 ? params['rows'][0] : 10,
    sort: params['sort'].length > 0 ? encode_sort(params['sort'][0]) : '_score desc',
    start: params['start'].length > 0 ? params['start'][0] : 0,
    
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
  
  if fq.length > 0 then aws_params[:filter_query] = fq end
  
  return aws_params
end

def facet_secondary_query(params, field_type)
  params.delete(field_type)
  aws_params = aws_encode(params)
  response = normalizeResponse($csClient.search(return: '_no_fields', **aws_params))
  return response['facets'][field_type]
end

def get_unit_display_name(unitFacets)
  for unitFacet in unitFacets
    unit = $unitsHash[unitFacet['value']]
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

def get_unit_hierarchy(unitFacets)
  for unitFacet in unitFacets
    unit = $unitsHash[unitFacet['value']]
    unitFacet['displayName'] = unit.name

    # get the direct ancestor to this oru unit if the ancestor is also an oru
    ancestor_id = $oruAncestors[unit.id]
    if ancestor_id
      # search the rest of the list to see if this ancestor is already in the facet list
      ancestor_in_list = false
      for u in unitFacets
        if ancestor_id == u['value']
          if u.key? 'descendents'
            u['descendents'].push(unitFacet)
          else
            u['descendents'] = [unitFacet]
          end
          ancestor_in_list = true
          unitFacet['ancestor_in_list'] = true
        end
      end

      # all ancestors should always be in list, per convert.rb#L398
      # which traces all the way up to the root,
      # recording all departments for each item along the way
      if !ancestor_in_list
        pp "DON'T KNOW WHAT TO DO HERE YIKES"
        ancestor = $unitsHash[ancestors[0].ancestor_unit]
        unitFacet['ancestor'] = {displayName: ancestor.name, value: ancestor.id}
      end
    end
  end

  for unitFacet in unitFacets
    if unitFacet['ancestor_in_list']
      unitFacets.delete(unitFacet)
    end
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

def get_license_display_name(facetList)
  for facet in facetList
    if facet['value'] == 'public'
      facet['displayName'] = 'Public'
    elsif facet['value'] == 'CC BY'
      facet['displayName'] = 'BY - Attribution required'
    elsif facet['value'] == 'CC BY-SA'
      facet['displayName'] = 'BY-SA - Attribution; Derivatives must use same license'
    elsif facet['value'] == 'CC BY-ND'
      facet['displayName'] = 'BY-ND - Attribution; No derivatives'
    elsif facet['value'] == 'CC BY-NC'
      facet['displayName'] = 'BY-NC - Attribution; NonCommercial use only'
    elsif facet['value'] == 'CC BY-NC-SA'
      facet['displayName'] = 'BY-NC-SA - Attribution; NonCommercial use; Derivatives use same license'
    elsif facet['value'] == 'CC BY-NC-ND'
      facet['displayName'] = 'BY-NC-ND - Attribution; NonCommercial use; No derivatives'
    end
  end
end

def parse_range(range)
  pp range
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
          itemUnit = $unitsHash[itemIssue.unit_id]
          itemHash[:journalInfo] = {displayName: "#{itemUnit.name}, #{itemIssue.volume}, #{itemIssue.issue}", issueId: itemIssue.id}
        #otherwise, use the item link to the unit table for all other content types
        else
          unitItem = UnitItem[:item_id => indexItem['id']]
          if unitItem
            unit = $unitsHash[unitItem.unit_id]
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
    {'display' => 'Publication Year', 'fieldName' => 'pub_year', 'range' => {pub_year_start: params['pub_year_start'][0], pub_year_end: params['pub_year_end'][0]}},
    {'display' => 'Campus', 'fieldName' => 'campuses', 'facets' => get_unit_display_name(facetHash['campuses']['buckets'])},
    {'display' => 'Departments', 'fieldName' => 'departments', 'facets' => get_unit_hierarchy(facetHash['departments']['buckets'])},
    {'display' => 'Journal', 'fieldName' => 'journals', 'facets' => get_unit_display_name(facetHash['journals']['buckets'])},
    {'display' => 'Discipline', 'fieldName' => 'disciplines', 'facets' => facetHash['disciplines']['buckets']},
    {'display' => 'Reuse License', 'fieldName' => 'rights', 'facets' => get_license_display_name(facetHash['rights']['buckets'])}
  ]

  return {'count' => response['hits']['found'], 'query' => get_query_display(params.clone), 'searchResults' => searchResults, 'facets' => facets}
end

# def campus_extent(params)
#   url = AWS_URL.clone
#   aws_params = {
#     'q' => "matchall",
#     'q.parser' => 'structured',
#     'fq' => "(field=campuses 'ucb')"
#   }
#   url.query = URI::encode_www_form(aws_params)
#   pp url.query
#
#   response = JSON.parse(Net::HTTP.get(url))
#   pp response
#   pp response['hits']['found']
# end
  
