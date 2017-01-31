# def populateDB()
#   unit = $unitsHash['uclalaw']
#   currentAttrs = JSON.parse(unit.attrs)
#
#   newAttrs = {
#     about: "Here is some sample about text about the UCLA School of Law department. Lalalalala!",
#     logo: "/images/temp_unit/uclalaw_institute_logo.jpg",
#     nav_bar: [
#        {name: 'Unit Home', slug: ''},
#        {name: 'About', slug: 'about'},
#        {name: 'Policies', slug: 'policies'},
#        {name: 'Submission Guidelines', slug: 'submission'},
#        {name: 'Contact', slug: 'contact'}
#      ],
#      directSubmit: "enabled"
#   }
#
#   attrs = JSON.generate(newAttrs)
#   unit.update(:attrs => attrs)
#
# end


def getUnitPageData(unitID)
  # populateDB();
  
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
          :extent => extent(unitID, unit.type)
        },
        unitDisplay: {
          :logo => attrs['logo'],
          :nav_bar => attrs['nav_bar'],
          :about => attrs['about']
        }
      }
      
      body = unitPage
      
      if unit.type == 'oru'
        body[:content] = getORULandingPageData(unitID)
      end
      if unit.type == 'series'
        body[:content] = getSeriesLandingPageData(unitID)
        # body.merge!(search(params))
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
    :related_orus => children ? children.select { |u| u.unit.type != 'series' }.map { |u| {unit_id: u.unit_id, name: u.unit.name} } : []
  }
end

def seriesPreview(u)
  items = UnitItem.filter(:unit_id => u.unit_id, :is_direct => true)
  preview = items.limit(3).map { |pair| Item[pair.item_id] }

  items = []
  for item in preview
    itemHash = {
      item_id: item.id,
      title: item.title
    }
    itemAttrs = JSON.parse(item.attrs)
    itemHash[:abstract] = itemAttrs['abstract']

    authors = ItemAuthors.where(item_id: item.id).map(:attrs).map { |author| JSON.parse(author)["name"] }
    itemHash[:authors] = authors
    items << itemHash
  end

  {
    :unit_id => u.unit_id,
    :name => u.unit.name,
    :count => items.count,
    :items => items,
  }
end

def getSeriesLandingPageData(id)
  parent = $hierByUnit[id]
  if parent.length > 1
    pp parent
  else
    children = parent ? $hierByAncestor[parent[0].ancestor_unit] : []
  end

  return {
    :series => children ? children.select { |u| u.unit.type == 'series' }.map { |u| {unit_id: u.unit_id, name: u.unit.name} } : []
  }
end

def getJournalLandingPageData(id)
  
end

# this was a stub for the item view in a series preview on a department landing page, 
# but I have a feeling this code can be generalized and will probably look much like 
# the data we get in search results for the item preview
# def itemPreview(i)
