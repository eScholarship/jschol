# def modifyUnit()
#   unit = $unitsHash['uclalaw_apalj']
#   currentAttrs = JSON.parse(unit.attrs)
#
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
#
#   attrs = JSON.generate(newAttrs)
#   unit.update(:attrs => attrs)
# end

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

# def addPage()

def getUnitPageData(unitID)
  # modifyUnit();
  
  content_type :json
  unit = $unitsHash[unitID]
  attrs = JSON.parse(unit.attrs)

  if !unit.nil?
    begin
      unitPage = {
        unitData: {
          :id => unitID,
          :name => unit.name,
          :type => unit.type,
          :extent => extent(unitID, unit.type),
          :about => attrs['about']
        },
        unitHeader: {
          :logo => attrs['logo'],
          :nav_bar => attrs['nav_bar'],
          :social => {
            :facebook => attrs['facebook'],
            :twitter => attrs['twitter'],
            :rss => attrs['rss']
          }
        }
      }
      
      body = unitPage
      
      if unit.type == 'oru'
        body[:content] = getORULandingPageData(unitID)
      end
      if unit.type == 'series'
        body[:content] = getSeriesLandingPageData(unitID)
      end
      if unit.type == 'journal'
        body[:content] = getJournalLandingPageData(unitID)
      end
      return body.merge(getUnitItemHeaderElements('unit', unitID)).to_json
    rescue Exception => e
      halt 404, e.message
    end
  else
    halt 404, "Unit not found"
  end
end

# items = UnitItem.filter(:unit_id => unitID, :is_direct => true)
# children = $hierByAncestor[unitID]
# parents = $hierByUnit[unitID]
# {
#   :parents => parents ? parents.map { |u| u.ancestor_unit } : [],
#   :children => children ? children.map { |u| {unit_id: u.unit_id, name: u.unit.name} } : [],
#   :nItems => items.count,
#   :items => items.limit(10).map { |pair| pair.item_id },
#   :attrs => unit.attrs
# }

# Get ORU-specific data for Department Landing Page
def getORULandingPageData(id)
  children = $hierByAncestor[id]

  return {
    :series => children ? children.select { |u| u.unit.type == 'series' }.map { |u| seriesPreview(u) } : [],
    :journals => children ? children.select { |u| u.unit.type == 'journal' }.map { |u| {unit_id: u.unit_id, name: u.unit.name} } : [],
    :related_orus => children ? children.select { |u| u.unit.type != 'series' && u.unit.type != 'journal' }.map { |u| {unit_id: u.unit_id, name: u.unit.name} } : []
  }
end

# Preview of Series for a Unit Landing Page
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

# TODO: rework for journal and unit context too
def getSeriesLandingPageData(id)
  parent = $hierByUnit[id]
  if parent.length > 1
    pp parent
  else
    children = parent ? $hierByAncestor[parent[0].ancestor_unit] : []
  end

  params = {
    "rows" => [10],
    "sort" => ['desc'],
    "start" => [0],
    "series" => [id]
  }
  response = search(params, [])
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

# this was a stub for the item view in a series preview on a department landing page, 
# but I have a feeling this code can be generalized and will probably look much like 
# the data we get in search results for the item preview
# def itemPreview(i)
