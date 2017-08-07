require 'digest'
require 'fastimage'

###################################################################################################
# Upload an asset file to S3 (if not already there), and return the asset ID. Attaches a hash of
# metadata to it.
def putAsset(filePath, metadata)

  # Calculate the sha256 hash, and use it to form the s3 path
  md5sum    = Digest::MD5.file(filePath).hexdigest
  sha256Sum = Digest::SHA256.file(filePath).hexdigest
  s3Path = "#{$s3Config.prefix}/binaries/#{sha256Sum[0,2]}/#{sha256Sum[2,2]}/#{sha256Sum}"

  # If the S3 file is already correct, don't re-upload it.
  obj = $s3Bucket.object(s3Path)
  if !obj.exists? || obj.etag != "\"#{md5sum}\""
    #puts "Uploading #{filePath} to S3."
    obj.put(body: File.new(filePath),
            metadata: {
              original_path: filePath.sub(%r{.*/([^/]+/[^/]+)$}, '\1'), # retain only last directory plus filename
              mime_type: MimeMagic.by_magic(File.open(filePath)).to_s
            }.merge(metadata))
    obj.etag == "\"#{md5sum}\"" or raise("S3 returned md5 #{resp.etag.inspect} but we expected #{md5sum.inspect}")
  end

  return sha256Sum
end

###################################################################################################
# Upload an image to S3, and return hash of its attributes. If a block is supplied, it will receive
# the dimensions first, and have a chance to raise exceptions on them.
def putImage(imgPath, metadata={}, &block)
  mimeType = MimeMagic.by_magic(File.open(imgPath))
  mimeType && mimeType.mediatype == "image" or raise("Non-image file #{imgPath}")
  dims = FastImage.size(imgPath)
  block and block.yield(dims)
  assetID = putAsset(imgPath, metadata.merge({
    width: dims[0].to_s,
    height: dims[1].to_s
  }))
  return { asset_id: assetID,
           image_type: mimeType.subtype,
           width: dims[0],
           height: dims[1]
         }
end
#################################################################################################

def traverseHierarchyUp(arr)
  if ['root', nil].include? arr[0][:id]
    return arr
  end
  unit = $unitsHash[$hierByUnit[arr[0][:id]][0].ancestor_unit]
  traverseHierarchyUp(arr.unshift({name: unit.name, id: unit.id, url: "/uc/" + unit.id}))
end

# Generate a link to an image in the S3 bucket
def getLogoData(data)
  data && data['asset_id'] or return nil
  return { url: "/assets/#{data['asset_id']}", width: data['width'], height: data['height'] }
end

# Add a URL to each nav bar item
def getNavBar(unit, pageName, navItems, level=1)
  if navItems
    navItems.each { |navItem|
      if navItem['type'] == 'folder'
        navItem['sub_nav'] = getNavBar(unit, pageName, navItem['sub_nav'], level+1)
      elsif navItem['slug']
        navItem['url'] = "/uc/#{unit.id}#{navItem['slug']=="" ? "" : "/"+navItem['slug']}"
      end
    }
    if level==1 && !['root','campus'].include?(unit.type)
      navItems.unshift({ id: 0, type: "home", name: "Unit Home", url: "/uc/#{unit.id}" })
    end
    return navItems
  end
  return nil
end

# Generate the last part of the breadcrumb for a static page or journal issue
def getPageBreadcrumb(unit, pageName, issue=nil)
  ((!pageName and !issue) || pageName == "home") and return []
  if issue
   return [{name: "Volume #{issue[:volume]}, Issue #{issue[:issue]}",
               id: issue[:unit_id] + ":" + issue[:volume] + ":" + issue[:issue],
              url: "/uc/#{issue[:unit_id]}/#{issue[:volume]}/#{issue[:issue]}"}]
  else
    pageName == "search" and return [{ name: "Search", id: unit.id + ":" + pageName}]
    pageName == "profile" and return [{ name: "Profile", id: unit.id + ":" + pageName}]
    pageName == "sidebar" and return [{ name: "Sidebars", id: unit.id + ":" + pageName}]
    p = Page.where(unit_id: unit.id, slug: pageName).first
    p or halt(404, "Unknown page #{pageName} in #{unit.id}")
    return [{ name: p[:name], id: unit.id + ":" + pageName, url: "/#{unit.id}/#{pageName}" }]
  end
end

# Generate breadcrumb and header content for Unit-branded pages
def getUnitHeader(unit, pageName=nil, journalIssue=nil, attrs=nil)
  if !attrs then attrs = JSON.parse(unit[:attrs]) end
  r = UnitHier.where(unit_id: unit.id).where(ancestor_unit: $activeCampuses.keys).first
  campusID = (unit.type=='campus') ? unit.id : r ? r.ancestor_unit : 'root'
  header = {
    :campusID => campusID,
    :campusName => $unitsHash[campusID].name,
    :campuses => $activeCampuses.values.map { |c| {id: c.id, name: c.name} }.unshift({id: "", name: "eScholarship at..."}),
    :logo => getLogoData(attrs['logo']),
    :nav_bar => getNavBar(unit, pageName, attrs['nav_bar']),
    :social => {
      :facebook => attrs['facebook'],
      :twitter => attrs['twitter'],
      :rss => attrs['rss']
    },
    :breadcrumb => (unit.type!='campus') ?
      traverseHierarchyUp([{name: unit.name, id: unit.id, url: "/uc/" + unit.id}]) + getPageBreadcrumb(unit, pageName, journalIssue)
      : getPageBreadcrumb(unit, pageName)
  }

  # if this unit doesn't have a nav_bar, get the next unit up the hierarchy's nav_bar
  if !header[:nav_bar] and unit.type != 'campus' and unit.type != 'root'
    ancestor = $hierByUnit[unit.id][0].ancestor
    until header[:nav_bar] || ancestor.id == 'root'
      header[:nav_bar] = JSON.parse(ancestor[:attrs])['nav_bar']
      ancestor = $hierByUnit[ancestor.id][0].ancestor
    end
  end

  return header
end

def getUnitPageContent(unit, attrs, query)
  if unit.type == 'oru'
   return getORULandingPageData(unit.id)
  elsif unit.type == 'campus'
    return getCampusLandingPageData(unit, attrs)
  elsif unit.type.include? 'series'
    return getSeriesLandingPageData(unit, query)
  elsif unit.type == 'journal'
    return getJournalIssueData(unit, attrs)
  else
    # ToDo: handle 'special' type here
    halt(404, "Unknown unit type #{unit.type}")
  end
end

# TODO carouselAttrs should not = ""
def getUnitMarquee(unit, attrs)
  carousel = Widget.where(unit_id: unit.id, region: "marquee", kind: "Carousel", ordering: 0).first
  if carousel && carousel.attrs
    carouselAttrs = JSON.parse(carousel.attrs)
  else
    carouselAttrs = ""
  end

  return {
    :about => attrs['about'],
    :carousel => attrs['carousel'],
    :slides => carouselAttrs['slides']
  }
end

# Get ORU-specific data for Department Landing Page
def getORULandingPageData(id)
  # addPage()
  children = $hierByAncestor[id]

  return {
    :series => children ? children.select { |u| u.unit.type == 'series' }.map { |u| seriesPreview(u) } : [],
    :monograph_series => children ? children.select { |u| u.unit.type == 'monograph_series' }.map { |u| seriesPreview(u) } : [],
    :journals => children ? children.select { |u| u.unit.type == 'journal' }.map { |u| {unit_id: u.unit_id, name: u.unit.name} } : [],
    :related_orus => children ? children.select { |u| u.unit.type == 'oru' }.map { |u| {unit_id: u.unit_id, name: u.unit.name} } : []
  }
end

# Get data for Campus Landing Page
def getCampusLandingPageData(unit, attrs)
  return {
    :pub_count =>     ($statsCampusPubs.keys.include? unit.id)  ? $statsCampusPubs[unit.id]     : 0,
    :view_count =>    0,
    :opened_count =>    0,
    :journal_count => ($statsCampusJournals.keys.include? unit.id) ? $statsCampusJournals[unit.id] : 0,
    :unit_count =>    ($statsCampusOrus.keys.include? unit.id)  ? $statsCampusOrus[unit.id]     : 0
  }
end

# Preview of Series for a Department Landing Page
def seriesPreview(u)
  items = UnitItem.filter(:unit_id => u.unit_id, :is_direct => true)
  count = items.count
  previewLimit = 3
  preview = items.limit(previewLimit).map(:item_id)
  itemData = readItemData(preview)

  {
    :unit_id => u.unit_id,
    :name => u.unit.name,
    :count => count,
    :previewLimit => previewLimit,
    :items => itemResultData(preview, itemData)
  }
end

def getSeriesLandingPageData(unit, q)
  parent = $hierByUnit[unit.id]
  if parent.length > 1
    pp parent    # ToDo: Is this case ever met?
  else
    children = parent ? $hierByAncestor[parent[0].ancestor_unit] : []
  end

  response = unitSearch(q ? q : {"sort" => ['desc']}, unit)
  response[:series] = children ? (children.select { |u| u.unit.type == 'series' } + 
    children.select { |u| u.unit.type == 'monograph_series' }).map { |u| seriesPreview(u) } : []
  return response
end

# Landing page data does not pass arguments volume/issue. It just gets most recent journal
def getJournalIssueData(unit, unit_attrs, volume=nil, issue=nil)
  display = unit_attrs['magazine_layout'] ? 'magazine' : 'simple'
  if unit_attrs['issue_rule'] and unit_attrs['issue_rule'] == 'secondMostRecent' and volume.nil? and issue.nil?
    secondIssue = Issue.where(:unit_id => unit.id).order(Sequel.desc(:pub_date)).first(2)[1]
    volume = secondIssue ? secondIssue.values[:volume] : nil
    issue = secondIssue ? secondIssue.values[:issue] : nil
  end
  return {
    display: display,
    issue: getIssue(unit.id, display, volume, issue),
    issues: Issue.where(:unit_id => unit.id).order(Sequel.desc(:pub_date)).to_hash(:id).map{|id, issue|
      h = issue.to_hash
      h[:attrs] and h[:attrs] = JSON.parse(h[:attrs])
      h
    }
  }
end

def isJournalIssue?(unit_id, volume, issue)
  !!Issue.first(:unit_id => unit_id, :volume => volume, :issue => issue)
end

def getIssue(id, display, volume=nil, issue=nil)
  if volume.nil?  # Landing page (most recent journal)
    i = Issue.where(:unit_id => id).order(Sequel.desc(:pub_date)).first
  else
    i = Issue.first(:unit_id => id, :volume => volume, :issue => issue)
  end
  return nil if i.nil?
  i = i.values
  if i[:attrs]
    attrs = JSON.parse(i[:attrs])
    attrs['title']       and i[:title] = attrs['title']
    attrs['description'] and i[:description] = attrs['description']
    attrs['cover']       and i[:cover] = attrs['cover']
    attrs['buy_link']    and i[:buy_link] = attrs['buy_link']
  end
  i[:sections] = Section.where(:issue_id => i[:id]).order(:ordering).all

  itemCC = {}
  i[:sections].map! do |section|
    section = section.values
    items = Item.where(:section=>section[:id]).order(:ordering_in_sect).to_hash(:id)
    itemCC[items.values[0][:rights]] = 1 unless items.values[0][:rights].nil?
    itemIds = items.keys
    authors = ItemAuthors.where(item_id: itemIds).order(:ordering).to_hash_groups(:item_id)

    itemData = {items: items, authors: authors}
    # Additional data field needed ontop of default
    resultsListFields = (display != "magazine") ? ['thumbnail'] : []
    section[:articles] = itemResultData(itemIds, itemData, resultsListFields)

    next section
  end
  # We're currently assigning an issue's rights by grabbing that of first article found
  i[:rights] = itemCC.keys.any? ? itemCC.keys[0] : nil
  if itemCC.keys.length > 1
    print "Warning: Expected only one license type across articles. Found #{itemCC.keys} for unit '#{id}'"
    volume and issue and print " Volume: '#{volume}', Issue: '#{issue}'. "
    puts "Just using first one found."
  end
  return i 
end

def unitSearch(params, unit)
  # ToDo: Right now, series landing page is the only unit type using this block. Clean this up
  # once a final decision has been made about display of different unit search pages
  if unit.type.include? 'series'
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
  page = Page[:slug=>pageName, :unit_id=>unit.id].values
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
    marquee: getUnitMarquee(unit, attrs)
  }
  
  if unit.type == 'journal'
    profile[:doaj] = attrs['doaj']
    profile[:license] = attrs['license']
    profile[:eissn] = attrs['eissn']
    profile[:magazine_layout] = attrs['magazine_layout']
    profile[:issue_rule] = attrs['issue_rule']
  end
  if unit.type == 'oru'
    profile[:seriesSelector] = true
  end
  return profile
end

def getItemAuthors(itemID)
  return ItemAuthors.filter(:item_id => itemID).order(:ordering).map(:attrs).collect{ |h| JSON.parse(h)}
end

# Get recent items (with author info) for a unit, by most recent eschol_date
def getRecentItems(unit)
  items = Item.join(:unit_items, :item_id => :id).where(unit_id: unit.id)
              .where(Sequel.lit("attrs->\"$.suppress_content\" is null"))
              .reverse(:eschol_date).limit(5)
  return items.map { |item|
    { id: item.id, title: item.title, authors: getItemAuthors(item.id) }
  }
end

def getUnitSidebar(unit)
  return Widget.where(unit_id: unit.id, region: "sidebar").order(:ordering).map { |widget|
    attrs =  widget[:attrs] ? JSON.parse(widget[:attrs]) : {}
    widget[:kind] == "RecentArticles" and attrs[:items] = getRecentItems(unit)
    next { id: widget[:id], kind: widget[:kind], attrs: attrs }
  }
end

def getUnitSidebarWidget(unit, widgetID)
  widget = Widget[widgetID]
  widget.unit_id == unit.id && widget.region == "sidebar" or jsonHalt(400, "invalid widget")
  return { id: widget[:id], kind: widget[:kind], attrs: widget[:attrs] ? JSON.parse(widget[:attrs]) : {} }
end

# Traverse the nav bar, including sub-folders, yielding each item in turn
# to the supplied block.
def travNav(navBar, &block)
  navBar.each { |nav|
    block.yield(nav)
    if nav['type'] == 'folder'
      travNav(nav['sub_nav'], &block)
    end
  }
end

def getNavByID(navBar, navID)
  travNav(navBar) { |nav|
    nav['id'].to_s == navID.to_s and return nav
  }
  return nil
end

def deleteNavByID(navBar, navID)
  return navBar.map { |nav|
    nav['id'].to_s == navID.to_s ? nil
      : nav['type'] == "folder" ? nav.merge({'sub_nav'=>deleteNavByID(nav['sub_nav'], navID) })
      : nav
  }.compact
end

def getUnitNavConfig(unit, navBar, navID)
  travNav(navBar) { |nav|
    if nav['id'].to_s == navID.to_s
      if nav['type'] == 'page'
        page = Page.where(unit_id: unit.id, slug: nav['slug']).first
        page or halt(404, "Unknown page #{nav['slug']} for unit #{unit.id}")
        nav['title'] = page.title
        nav['attrs'] = JSON.parse(page.attrs)
      end
      return nav
    end
  }
  halt(404, "Unknown nav #{navID} for unit #{unit.id}")
end

###################################################################################################
def maxNavID(navBar)
  n = 0
  travNav(navBar) { |nav| n = [n, nav["id"]].max }
  return n
end

def jsonHalt(httpCode, message)
  content_type :json
  halt(httpCode, { error: true, message: message }.to_json)
end

put "/api/unit/:unitID/nav/:navID" do |unitID, navID|
  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or halt(401)
  content_type :json

  DB.transaction {
    unit = Unit[unitID] or jsonHalt(404, "Unit not found")
    unitAttrs = JSON.parse(unit.attrs)
    params[:name].empty? and jsonHalt(400, "Page name must be supplied.")

    travNav(unitAttrs['nav_bar']) { |nav|
      next unless nav['id'].to_s == navID.to_s
      nav['name'] = params[:name]
      if nav['type'] == "page"
        page = Page.where(unit_id: unitID, slug: nav['slug']).first or halt(404, "Page not found")

        oldSlug = page.slug
        newSlug = params[:slug]
        newSlug.empty? and jsonHalt(400, "Slug must be supplied.")
        newSlug =~ /^[a-zA-Z][a-zA-Z0-9_]+$/ or jsonHalt(400,
          message: "Slug must start with a letter a-z, and consist only of letters a-z, numbers, or underscores.")
        page.slug = newSlug
        nav['slug'] = newSlug

        page.name = params[:name]
        page.name.empty? and jsonHalt(400, "Page name must be supplied.")

        page.title = params[:title]
        page.title.empty? and jsonHalt(400, "Title must be supplied.")

        newHTML = sanitizeHTML(params[:attrs][:html])
        newHTML.empty? and jsonHalt(400, "Text must be supplied.")
        page.attrs = JSON.parse(page.attrs).merge({ "html" => newHTML }).to_json
        page.save
      elsif nav['type'] == "link"
        params[:url] =~ %r{^(/\w|https?://).*} or jsonHalt(400, "Invalid URL.")
        nav['url'] = params[:url]
      end
      unit.attrs = unitAttrs.to_json
      unit.save
      refreshUnitsHash
      return {status: "ok"}.to_json
    }
    jsonHalt(404, "Unknown nav #{navID} for unit #{unitID}")
  }
end

def remapOrder(oldNav, newOrder)
  newOrder = newOrder.map { |stub| stub['id'] == 0 ? nil : stub }.compact
  return newOrder.map { |stub|
    source = getNavByID(oldNav, stub['id'])
    source or raise("Unknown nav id #{stub['id']}")
    newNav = source.clone
    if source['type'] == "folder"
      stub['sub_nav'] or raise("can't change nav type")
      newNav['sub_nav'] = remapOrder(oldNav, stub['sub_nav'])
    end
    next newNav
  }
end

###################################################################################################
# *Put* to change the ordering of nav bar items
put "/api/unit/:unitID/navOrder" do |unitID|
  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or halt(401)
  content_type :json

  DB.transaction {
    unit = Unit[unitID] or halt(404, "Unit not found")
    unitAttrs = JSON.parse(unit.attrs)
    newOrder = JSON.parse(params[:order])
    newOrder.empty? and jsonHalt(400, "Page name must be supplied.")
    newNav = remapOrder(unitAttrs['nav_bar'], newOrder)
    unitAttrs['nav_bar'] = newNav
    unit.attrs = unitAttrs.to_json
    unit.save
    refreshUnitsHash
    return {status: "ok"}.to_json
  }
end

###################################################################################################
# *Post* to add an item to a nav bar
post "/api/unit/:unitID/nav" do |unitID|
  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or halt(401)

  # Grab unit data
  unit = Unit[unitID]
  unit or halt(404)

  # Validate the nav type
  navType = params[:navType]
  ['page', 'link', 'folder'].include?(navType) or halt(400)

  # Find the existing nav bar
  attrs = JSON.parse(unit.attrs)
  (navBar = attrs['nav_bar']) or raise("Unit has non-existent nav bar")

  # Invent a unique name for the new item
  slug = name = nil
  (1..9999).each { |n|
    slug = "#{navType}#{n.to_s}"
    name = "New #{navType} #{n.to_s}"
    existing = nil
    travNav(navBar) { |nav|
      if nav['slug'] == slug || nav['name'] == name
        existing = nav
      end
    }
    break unless existing
  }

  nextID = maxNavID(navBar) + 1

  DB.transaction {
    newNav = case navType
    when "page"
      Page.create(slug: slug, unit_id: unitID, name: name, title: name, attrs: { html: "" }.to_json)
      newNav = { id: nextID, type: "page", name: name, slug: slug, hidden: true }
    when "link"
      newNav = { id: nextID, type: "link", name: name, url: "" }
    when "folder"
      newNav = { id: nextID, type: "folder", name: name, sub_nav: [] }
    else
      halt(400, "unknown navType")
    end

    navBar << newNav
    attrs['nav_bar'] = navBar
    unit[:attrs] = attrs.to_json
    unit.save
    refreshUnitsHash

    return { status: "ok", nextURL: "/uc/#{unitID}/nav/#{newNav[:id]}" }.to_json
  }
end

###################################################################################################
# *Post* to add a widget to the sidebar
post "/api/unit/:unitID/sidebar" do |unitID|
  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or jsonHalt(401, "unauthorized")

  # Grab unit data
  unit = Unit[unitID]
  unit or jsonHalt(404, "unknown unit")

  # Validate the widget kind
  widgetKind = params[:widgetKind]
  ['RecentArticles', 'Text', 'Tweets'].include?(widgetKind) or jsonHalt(400, "Invalid widget kind")

  # Initial attributes are kind-specific
  attrs = case widgetKind
  when "Text"
    { title: "New #{widgetKind}", html: "" }
  else
    {}
  end

  # Determine an ordering that will place this last.
  lastOrder = Widget.where(unit_id: unitID).max(:ordering)
  order = (lastOrder || 0) + 1

  # Okay, create it.
  newID = Widget.create(unit_id: unitID, kind: widgetKind,
                        ordering: order, attrs: attrs.to_json, region: "sidebar").id
  return { status: "ok", nextURL: "/uc/#{unitID}/sidebar/#{newID}" }.to_json
end

###################################################################################################
# *Put* to change the ordering of sidebar widgets
put "/api/unit/:unitID/sidebarOrder" do |unitID|
  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or halt(401)
  content_type :json

  DB.transaction {
    unit = Unit[unitID] or jsonHalt(404, "Unit not found")
    newOrder = JSON.parse(params[:order])
    Widget.where(unit_id: unitID).count == newOrder.length or jsonHalt(400, "must reorder all at once")

    # Make two passes, to absolutely avoid conflicting order in the table at any time.
    maxOldOrder = Widget.where(unit_id: unitID).max(:ordering)
    (1..2).each { |pass|
      offset = (pass == 1) ? maxOldOrder+1 : 1
      newOrder.each_with_index { |widgetID, idx|
        w = Widget[widgetID]
        w.unit_id == unitID or jsonHalt(400, "widget/unit mistmatch")
        w.ordering = idx + offset
        w.save
      }
    }
  }

  refreshUnitsHash
  return {status: "ok"}.to_json
end

###################################################################################################
# *Delete* to remove sidebar widget
delete "/api/unit/:unitID/sidebar/:widgetID" do |unitID, widgetID|
  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or halt(401)

  DB.transaction {
    unit = Unit[unitID] or halt(404, "Unit not found")
    widget = Widget[widgetID]
    widget.unit_id == unitID and widget.region == "sidebar" or jsonHalt(400, "invalid widget")
    widget.delete
  }

  content_type :json
  return {status: "ok", nextURL: unitID=="root" ? "/" : "/uc/#{unitID}" }.to_json
end

###################################################################################################
# *Delete* to remove a static page from a unit
delete "/api/unit/:unitID/nav/:navID" do |unitID, navID|
  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or halt(401)

  DB.transaction {
    unit = Unit[unitID] or halt(404, "Unit not found")
    unitAttrs = JSON.parse(unit.attrs)
    nav = getNavByID(unitAttrs['nav_bar'], navID)
    unitAttrs['nav_bar'] = deleteNavByID(unitAttrs['nav_bar'], navID)
    getNavByID(unitAttrs['nav_bar'], navID).nil? or raise("delete failed")
    if nav['type'] == "folder" && !nav['sub_nav'].empty?
      jsonHalt(404, "Can't delete non-empty folder")
    end
    if nav['type'] == "page"
      page = Page.where(unit_id: unitID, slug: nav['slug']).first or jsonHalt(404, "Page not found")
      page.delete
    end

    unit.attrs = unitAttrs.to_json
    unit.save
  }

  refreshUnitsHash
  content_type :json
  return {status: "ok", nextURL: unitID=="root" ? "/" : "/uc/#{unitID}" }.to_json
end

###################################################################################################
# *Put* to change the attributes of a sidebar widget
put "/api/unit/:unitID/sidebar/:widgetID" do |unitID, widgetID|

  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or halt(401)

  DB.transaction {
    unit = Unit[unitID] or halt(404, "Unit not found")
    widget = Widget[widgetID]
    inAttrs = params[:attrs]
    attrs = {}
    inAttrs[:title] and attrs[:title] = sanitizeHTML(inAttrs[:title])
    inAttrs[:html]  and attrs[:html]  = sanitizeHTML(inAttrs[:html])
    widget.attrs = attrs.to_json
    widget.save
  }

  # And let the caller know it went fine.
  content_type :json
  return { status: "ok" }.to_json
end

###################################################################################################
# *Put* to change the main text on a static page
put "/api/static/:unitID/:pageName/mainText" do |unitID, pageName|

  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or halt(401)

  # Grab page data from the database
  page = Page.where(unit_id: unitID, slug: pageName).first or halt(404, "Page not found")

  # Parse the HTML text, and sanitize to be sure only allowed tags are used.
  safeText = sanitizeHTML(params[:newText])

  # Update the database
  page.attrs = JSON.parse(page.attrs).merge({ "html" => safeText }).to_json
  page.save

  # And let the caller know it went fine.
  content_type :json
  return { status: "ok" }.to_json
end

###################################################################################################
# *Put* to change unit profile properties: content configuration
put "/api/unit/:unitID/profileContentConfig" do |unitID|
  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or halt(401)

  carouselKeys = params['data'].keys.grep /(header|text)\d+/
  carouselSlides = {}
  if carouselKeys.length > 0
    numSlides = carouselKeys.map! {|x| /(header|text)(\d+)/.match(x)[2].to_i}.max
    (0..numSlides).each do |n|
      slide = {header: params['data']["header#{n}"], text: params['data']["text#{n}"]}
      carouselSlides[n] = slide
    end
  end

  DB.transaction {
    carouselConfig(carouselSlides, unitID)

    unit = Unit[unitID] or jsonHalt(404, "Unit not found")
    unitAttrs = JSON.parse(unit.attrs)

    if params['data']['magazine_layout'] == "on"
      unitAttrs['magazine_layout'] = true
    else
      unitAttrs.delete('magazine_layout')
    end

    if params['data']['issue_rule'] == "secondMostRecent"
      unitAttrs['issue_rule'] = "secondMostRecent"
    else
      unitAttrs.delete('issue_rule')
    end
    
    if params['data']['about'] then unitAttrs['about'] = params['data']['about'] end
    if params['data']['carouselFlag'] && params['data']['carouselFlag'] == 'on'
      unitAttrs['carousel'] = true
    else
      unitAttrs.delete('carousel')
    end
    if params['data']['facebook'] then unitAttrs['facebook'] = params['data']['facebook'] end
    if params['data']['twitter'] then unitAttrs['twitter'] = params['data']['twitter'] end
    
    unit.attrs = unitAttrs.to_json
    unit.save
  }

  refreshUnitsHash
  content_type :json
  return { status: "ok" }.to_json
end

def carouselConfig(slides, unitID)
  carousel = Widget.where(unit_id: unitID, region: "marquee", kind: "Carousel", ordering: 0).first
  if !carousel
    carousel = Widget.new(unit_id: unitID, region: "marquee", kind: "Carousel", ordering: 0)
  end
  
  if carousel.attrs
    carouselAttrs = JSON.parse(carousel.attrs)
    slides.each do |k,v|
      # if the slide already exists, merge new config with old config
      if k < carouselAttrs['slides'].length
        carouselAttrs['slides'][k] = carouselAttrs['slides'][k].merge(v.to_a.collect{|x| [x[0].to_s, x[1]]}.to_h) 
      elsif carouselAttrs['slides'].length > 0
        # TODO: shouldn't technically be a PUSH - if multiple new slides are added at once, new slide 6 could be before new slide 5 in slides.each; slide 6 is pushed and is now slide 5, then slide 5 comes and overwrites the data for slide 6
        carouselAttrs['slides'].push(v.to_a.collect{|x| [x[0].to_s, x[1]]}.to_h)
      else 
        carouselAttrs['slides'] = [v.to_a.collect{|x| [x[0].to_s, x[1]]}.to_h]
      end
    end
  else
    carouselAttrs = {slides: ''}
  end
  
  carousel.attrs = carouselAttrs.to_json
  carousel.save
end

post "/api/unit/:unitID/upload" do |unitID|
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or halt(401)

  # upload images for carousel configuration
  slideImageKeys = params.keys.grep /slideImage/
  if slideImageKeys.length > 0
    slideImage_data = []
    for slideImageKey in slideImageKeys
      image_data = putImage(params[slideImageKey][:tempfile].path, { original_path: params[slideImageKey][:filename] })
      image_data[:slideNumber] = /slideImage(\d*)/.match(slideImageKey)[1]
      slideImage_data.push(image_data)
    end
    DB.transaction {
      carousel = Widget.where(unit_id: unitID, region: "marquee", kind: "Carousel", ordering: 0).first
      carouselAttrs = JSON.parse(carousel.attrs)
      for slideImage in slideImage_data
        slideNumber = slideImage[:slideNumber].to_i
        image_data = slideImage.reject{|k,v| k == :slideNumber}.to_a.collect{|x| [x[0].to_s, x[1]]}.to_h
        if slideNumber < carouselAttrs['slides'].length
          carouselAttrs['slides'][slideNumber]['image'] = image_data
        elsif carouselAttrs['slides'].length > 0
          # TODO: shouldn't technically be a PUSH - if multiple new slides are added at once, new slide 6 could be before new slide 5 in slides.each; slide 6 is pushed and is now slide 5, then slide 5 comes and overwrites the data for slide 6
          carouselAttrs['slides'].push({'image': image_data})
        else
          carouselAttrs['slides'] = [{'images': image_data}]
        end
      end
      carousel.attrs = carouselAttrs.to_json
      carousel.save
    }
  end

  # upload images for unit profile logo
  if params.has_key? :logo and params[:logo] != ""
    logo_data = putImage(params[:logo][:tempfile].path, { original_path: params[:logo][:filename] })
    DB.transaction {
      unit = Unit[unitID] or jsonHalt(404, "Unit not found")
      unitAttrs = JSON.parse(unit.attrs)
      unitAttrs['logo'] = logo_data.to_a.collect{|x| [x[0].to_s, x[1]]}.to_h
      unit.attrs = unitAttrs.to_json
      unit.save
    }
  elsif params[:logo] == ""
    #REMOVE LOGO
  end

  content_type :json
  return { status: "okay" }.to_json
end

post "/api/unit/:unitID/uploadEditorImg" do |unitID|
  getUserPermissions(params[:username], params[:token], unitID)[:admin] or halt(401)
  img_data = putImage(params[:image][:tempfile].path, { original_path: params[:image][:filename] })
  content_type :json
  return { success: true, link: "/assets/#{img_data[:asset_id]}" }.to_json
end

post "/api/unit/:unitID/uploadEditorFile" do |unitID|
  getUserPermissions(params[:username], params[:token], unitID)[:admin] or halt(401)
  assetID = putAsset(params[:file][:tempfile].path, { original_path: params[:file][:filename] })
  content_type :json
  return { success: true, link: "/assets/#{assetID}" }.to_json
end

delete "/api/unit/:unitID/removeCarouselSlide/:slideNumber" do |unitID, slideNumber|
  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or halt(401)

  DB.transaction {
    carousel = Widget.where(unit_id: unitID, region: "marquee", kind: "Carousel", ordering: 0).first

    if carousel.attrs
      carouselAttrs = JSON.parse(carousel.attrs)
      carouselAttrs['slides'].delete_at(slideNumber.to_i)
    end
    carousel.attrs = carouselAttrs.to_json
    carousel.save
  }

  content_type :json
  return { status: "ok" }.to_json
end
