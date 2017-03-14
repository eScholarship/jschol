def traverseHierarchyUp(arr)
  if ['root', nil].include? arr[0][:id]
    return arr
  end
  unit = $unitsHash[$hierByUnit[arr[0][:id]][0].ancestor_unit]
  traverseHierarchyUp(arr.unshift({name: unit.name, id: unit.id}))
end

# Generate breadcrumb and header content for Unit-branded pages
def getUnitHeader(unit, attrs=nil)
  if !attrs then attrs = JSON.parse(unit[:attrs]) end
  campusID = UnitHier.where(unit_id: unit.id).where(ancestor_unit: $activeCampuses.keys).first.ancestor_unit
  
  header = {
    :campusID => campusID,
    :campusName => $unitsHash[campusID].name,
    :campuses => $activeCampuses.values.map { |c| {id: c.id, name: c.name} }.unshift({id: "", name: "eScholarship at..."}),
    :logo => attrs['logo'],
    :nav_bar => attrs['nav_bar'],
    :social => {
      :facebook => attrs['facebook'],
      :twitter => attrs['twitter'],
      :rss => attrs['rss']
    },
    :breadcrumb => traverseHierarchyUp([{name: unit.name, id: unit.id}])
  }
  
  # if this unit doesn't have a nav_bar, get the next unit up the hierarchy's nav_bar
  if !header[:nav_bar]
    ancestor = $hierByUnit[unit.id][0].ancestor
    until header[:nav_bar] || ancestor.id == 'root'
      header[:nav_bar] = JSON.parse(ancestor[:attrs])['nav_bar']
      ancestor = $hierByUnit[ancestor.id][0].ancestor
    end
  end

  return header
end

def getUnitPageContent(unit, attrs, pageName)
  if pageName == "home"
    if unit.type == 'oru'
      return getORULandingPageData(unit.id)
    end
    if unit.type == 'series'
      return getSeriesLandingPageData(unit)
    end
    if unit.type == 'journal'
      return getJournalLandingPageData(unit.id)
    end
  elsif pageName == "search"
    return getUnitSearchData(unit)
  end
end

def getUnitMarquee(unit, attrs)
  return {
    :extent => extent(unit.id, unit.type),
    :about => attrs['about'],
    :carousel => attrs['carousel']
  }
end

# Get ORU-specific data for Department Landing Page
def getORULandingPageData(id)
  # addPage()
  children = $hierByAncestor[id]

  return {
    :series => children ? children.select { |u| u.unit.type == 'series' }.map { |u| seriesPreview(u) } : [],
    :journals => children ? children.select { |u| u.unit.type == 'journal' }.map { |u| {unit_id: u.unit_id, name: u.unit.name} } : [],
    :related_orus => children ? children.select { |u| u.unit.type != 'series' && u.unit.type != 'journal' }.map { |u| {unit_id: u.unit_id, name: u.unit.name} } : []
  }
end

# Preview of Series for a Department Landing Page
def seriesPreview(u)
  items = UnitItem.filter(:unit_id => u.unit_id, :is_direct => true)
  count = items.count
  preview = items.limit(3).map(:item_id)
  itemData = readItemData(preview)

  {
    :unit_id => u.unit_id,
    :name => u.unit.name,
    :count => count,
    :items => itemResultData(preview, itemData)
  }
end

def getSeriesLandingPageData(unit)
  parent = $hierByUnit[unit.id]
  if parent.length > 1
    pp parent
  else
    children = parent ? $hierByAncestor[parent[0].ancestor_unit] : []
  end

  response = unitSearch({"sort" => ['desc']}, unit)
  response[:series] = children ? children.select { |u| u.unit.type == 'series' }.map { |u| {unit_id: u.unit_id, name: u.unit.name} } : []
  return response
end

def getJournalLandingPageData(id)
  unit = $unitsHash[id]
  attrs = JSON.parse(unit.attrs)
  return {
    display: attrs['magainze'] ? 'magazine' : 'simple',
    issue: getIssue(id)
  }
end

def getIssue(id)
  issue = Issue.where(:unit_id => id).order(Sequel.desc(:pub_date)).first.values
  issue[:sections] = Section.where(:issue_id => issue[:id]).order(:ordering).all

  issue[:sections].map! do |section|
    section = section.values
    items = Item.where(:section=>section[:id]).order(:ordering_in_sect).to_hash(:id)
    itemIds = items.keys
    authors = ItemAuthors.where(item_id: itemIds).order(:ordering).to_hash_groups(:item_id)

    itemData = {items: items, authors: authors}

    section[:articles] = itemResultData(itemIds, itemData)

    next section
  end
  return issue
end



def unitSearch(params, unit)
  if unit.type == 'series'
    resultsListFields = ['thumbnail', 'pub_year', 'publication_information', 'type_of_work', 'rights']
    params["series"] = [unit.id]
  elsif unit.type == 'oru'
    resultsListFields = ['thumbnail', 'pub_year', 'publication_information', 'type_of_work']
    params["departments"] = [unit.id]
  elsif unit.type == 'journal'
    resultsListFields = ['thumbnail', 'pub_year', 'publication_information']
    params["journals"] = [unit.id]
  elsif unit.type == 'campus'
    resultsListFields = ['thumbnail', 'pub_year', 'publication_information', 'type_of_work', 'rights', 'peer_reviewed']
    params["campuses"] = [unit.id]
  else
    #throw 404
    pp unit.type
  end

  aws_params = aws_encode(params, [])
  response = normalizeResponse($csClient.search(return: '_no_fields', **aws_params))

  if response['hits'] && response['hits']['hit']
    itemIds = response['hits']['hit'].map { |item| item['id'] }
    itemData = readItemData(itemIds)
    searchResults = itemResultData(itemIds, itemData, resultsListFields)
  end

  return {'count' => response['hits']['found'], 'query' => get_query_display(params.clone), 'searchResults' => searchResults}
end

def getUnitStaticPage(unit, attrs, pageName)
  page = Page[:nav_element=>pageName, :unit_id=>unit.id].values
  page[:attrs] = JSON.parse(page[:attrs])
  return page
end

def getUnitProfile(unit, attrs)
  profile = {
    name: unit.name,
    slug: unit.id,
    logo: attrs['logo'],
    facebook: attrs['facebook'],
    twitter: attrs['twitter'],
  }
  if unit.type == 'journal'
    profile[:doaj] = true
    profile[:license] = 'cc-by'
    profile[:eissn] = '0160-2764'
    profile[:issue] = 'most recent'
    profile[:layout] = 'simple'
  end
  return profile
end

#   newAttrs = {
#     about: "Here's some sample text about the UCLA School of Law's Asian Pacific American Law Journal. Lalalalala!",
#     nav_bar: [
#        {name: 'Journal Home', slug: ''},
#        {name: 'Issues', subNav: true},
#        {name: 'About', slug: 'about'},
#        {name: 'Policies', slug: 'policies'},
#        {name: 'Submission Guidelines', slug: 'submission'},
#        {name: 'Contact', slug: 'contact'}
#      ],
#      twitter: "apalj",
#      directSubmit: "enabled",
#      magazine: true
#   }


def modifyUnit()
  unit = $unitsHash['uclalaw']
  currentAttrs = JSON.parse(unit.attrs)

  currentAttrs['nav_bar'] = [
    {
      "name": "Unit Home",
      "slug": ""
    },
    {
      "name": "About",
      "sub_nav": [
        {"name": "About Us", "slug": "about-us"},
        {"name": "Aims & Scope", "slug": "aims-scope"},
        {"name": "Editorial Board", "slug": "editorial-board"}
      ]
    },
    {
      "name": "Policies",
      "url": "http://lmgtfy.com/?q=policies"
    },
    {
      "name": "Submission Guidelines",
      "slug": "submission-guidelines"
    },
    {
      "name": "Contact",
      "slug": "contact"
    }
  ]

  attrs = JSON.generate(currentAttrs)
  unit.update(:attrs => attrs)
end

# def addWidget()
#   carouselWidget = new Widget({
#     unit_id: 'uclalaw',
#     kind: 'carousel',
#     region: 'top_panel',
#     order: '0',
#     attrs: [
#       { image: ,
#         header: ,
#         text: ,
#         link: ,
#         altTag: ,
#         textColor: ,
#         gradientColor: ,
#         headerColor: ,
#         linkColor: ,
#         textAlignment:
#       }
#     ]
#   })
# end

def addPage()
  # page = Page[unit_id: 'uclalaw']
  # page.update(nav_element: 'contact')
  
  # contactPage = Page.create({
  #   unit_id: 'uclalaw',
  #   nav_element: 'contact',
  #   title: 'Contact Us'
  #   # html: '<b>Content here!</b>'
  # })
end