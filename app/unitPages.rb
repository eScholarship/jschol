require 'digest'
require 'fastimage'

###################################################################################################
# Upload an asset file to S3 (if not already there), and return the asset ID. Attaches a hash of
# metadata to it.
def putAsset(filePath, metadata)

  # Calculate the sha256 hash, and use it to form the s3 path
  md5sum    = Digest::MD5.file(filePath).hexdigest
  sha256Sum = Digest::SHA256.file(filePath).hexdigest
  s3Path = "#{getEnv("S3_BINARIES_PREFIX")}/#{sha256Sum[0,2]}/#{sha256Sum[2,2]}/#{sha256Sum}"

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
def checkImageSize(imgContext, dims, fileSize)
  maxWidth, maxHeight, maxK = case imgContext
    when 'slide';   [900,  500, 250]
    when 'logo';    [800,   90, 250]
    when 'hero';    [1000, 400, 300]
    when 'sidebar'; [350,  700, 250]
    when 'content'; [900, 1800, 250]
    else raise("unrecognized imgContext #{imgContext.inspect}")
  end
  if dims[0] > maxWidth || dims[1] > maxHeight
    jsonHalt(413, "Error: image (#{dims[0]}x#{dims[1]}) exceeds maximum (#{maxWidth}x#{maxHeight}) pixels.")
  end
  if fileSize > maxK*1024
    jsonHalt(413, "Error: image file size #{(fileSize+1023)>>10}K exceeds maximum size of #{maxK}K.")
  end
end

###################################################################################################
# Upload an image to S3, and return hash of its attributes. If a block is supplied, it will receive
# the dimensions first, and have a chance to raise exceptions on them.
def putImage(imgContext, imgPath, metadata={}, &block)
  mimeType = MimeMagic.by_magic(File.open(imgPath))
  mimeType && mimeType.mediatype == "image" or raise("Non-image file #{imgPath}")
  dims = FastImage.size(imgPath)
  checkImageSize(imgContext, dims, File.size(imgPath))
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
  if unit.id == 'other'
    unit = $unitsHash['root']
  end
  traverseHierarchyUp(arr.unshift(
    {name: unit.name, id: unit.id, url: unit.type == "root" ? "/" : "/uc/#{unit.id}"}))
end

# Generate a link to an image in the S3 bucket
def getLogoData(data)
  data && data['asset_id'] or return nil
  return { url: "/cms-assets/#{data['asset_id']}", width: data['width'], height: data['height'], is_banner: data['is_banner'] }
end

def isTopmostUnit(unit)
  return ['root','campus'].include?(unit.type)
end

# Assumes unit is not topMost
def getUnitAncestor(unit)
  return $hierByUnit[unit.id][0].ancestor
end

# Get list of nav slugs by traversing the nav
def getSlugs(navItems, slugs = nil)
  slugs ||= Set.new
  navItems and navItems.each { |navItem|
    if navItem['type'] == 'folder'
      getSlugs(navItem['sub_nav'], slugs)
    end
    navItem['slug'] and slugs << navItem['slug']
  }
  return slugs
end

# Permissions per nav item
def getNavPerms(unit, navItems, userPerms)
  noAccess = { change_slug: false, change_text: false, remove: false, reorder: false }
  unit.nil? and return noAccess
  result = {}
  slugs = getSlugs(navItems)
  slugs << "link" << "folder" << "page"  # special pseudo-slugs for specials
  slugs.each { |slug|
    if unit.type.include?("series")
      result[slug] =   noAccess
    elsif userPerms[:super]
      result[slug] =   { change_slug: true,  change_text: true,  remove: true,  reorder: true  }
    elsif !userPerms[:admin]
      result[slug] =   noAccess
    elsif unit.type == 'campus'
      result[slug] =   noAccess
    else
      case slug
      when /^(policyStatement|policies|policiesProcedures|journal_policies|policy)$/i
        result[slug] = { change_slug: false, change_text: false, remove: false, reorder: true  }
      when /^(submitPaper|submissionGuidelines|submissionprocess|howsubmit)$/i
        result[slug] = { change_slug: false, change_text: true,  remove: false, reorder: true  }
      when /^(contactUs|contact)$/i
        result[slug] = { change_slug: false, change_text: true,  remove: false, reorder: false }
      when /^(aboutus|about)$/i
        result[slug] = { change_slug: false, change_text: true,  remove: false, reorder: true  }
      else
        result[slug] = { change_slug: true,  change_text: true,  remove: true,  reorder: true  }
      end
    end
  }
  return result
end

def getPubYear(pubDate)
  pubDate.nil? ? nil : pubDate.strftime("%Y")
end

def getIssueName(vol, iss, numbering, title, year)
  if (vol == "0" and iss == "0")
    return title.nil? ? 'Articles in Press' : title
  else
    voliss = nil
    if (!numbering)
      voliss = "Volume " + vol + ", Issue " + iss 
    elsif (numbering === "volume_only")
      voliss = "Volume " + vol 
    else
      voliss = "Issue " + iss 
    end
    return voliss + ", " + year 
  end
end

# Takes array of hashes representing all pubished issues in this journal
# Does some transformation so that it can be read into a navigational component
def getIssuesSubNav(issues)
  issues.nil? and return []
  # rename id to issue_id otherwise possible collision in nav.
  mappings = {:id => "issue_id"}
  issues_rev = []
  issues.each.with_index(1) do |issue, index|
    issue = issue.map {|k, v| [mappings[k] || k, v] }.to_h
    issue["id"] = -(index)   # Create new (negative) id
    issue["url"] = "/uc/#{issue[:unit_id]}/#{issue[:volume]}/#{issue[:issue]}"
    issue["name"] = getIssueName(issue[:volume], issue[:issue], issue[:attrs].nil? ? nil : issue[:attrs]['numbering'], 
                     issue[:attrs].nil? ? nil : issue[:attrs]['title'], getPubYear(issue[:published]))
    issue["type"] = "page"
    issues_rev << issue
  end
  return issues_rev
end

#  Make issue dropdown name based on default issue from db, or most recent issue. Default is 'Issues'
def getIssueDropDownName(unit, sub_nav)
  default_issue = JSON.parse(unit.attrs)['default_issue']
  if default_issue.nil?
    if sub_nav[0] and sub_nav[0][:attrs]
      return sub_nav[0][:attrs]["numbering"] == 'volume_only' ? "Volumes" : "Issues"
    end
    return "Issues"
  else 
    return default_issue['numbering'] == 'volume_only' ? "Volumes" : "Issues"
  end
end

# Add a URL to each nav bar item; Include item "Home" (fixed_page) and - if journal - issue dropdown (fixed_folder)
def getNavBar(unit, navItems, level=1, issuesSubNav=nil)
  if navItems
    navItems.each { |navItem|
      if navItem['type'].include?('folder')
        navItem['sub_nav'] = getNavBar(unit, navItem['sub_nav'], level+1)
      elsif navItem['slug']
        if unit.id == 'root'
          navItem['url'] = "/#{navItem['slug']}"
        else
          navItem['url'] = "/uc/#{unit.id}#{navItem['slug']=="" ? "" : "/"+navItem['slug']}"
        end
      end
    }
    if level==1 && !isTopmostUnit(unit)
      unitID = unit.type.include?('series') ? getUnitAncestor(unit).id : unit.id
      if unit.type == "journal" && issuesSubNav && issuesSubNav.length > 0
        navItems.unshift({ "id"=>0, "type"=>"fixed_folder",
                          "name"=>getIssueDropDownName(unit, issuesSubNav),
                          "url"=>nil, "sub_nav"=>issuesSubNav })
      end
      navItems.unshift({ "id"=>-9999, "type"=>"fixed_page",
                         "name"=>unit.type == "journal" ? "Journal Home" : "Unit Home",
                         "url"=>"/uc/#{unitID}" })
    end
    return navItems
  end
  return nil
end

# Generate the last part of the breadcrumb for a static page or journal issue
def getPageBreadcrumb(unit, pageName, issue=nil)
  ((!pageName and !issue) || pageName == "home") and return []
  if issue
   vol = "Volume #{issue[:volume]}"
   iss = "Issue #{issue[:issue]}"
   if issue[:volume] == "0" and issue[:issue] == "0"
     name = issue[:title] 
   elsif !issue[:numbering]
     name = vol + ", " + iss 
   elsif issue[:numbering] == "volume_only"
     name = vol 
   else
     name = iss 
   end
   return [{name: name,
               id: issue[:unit_id] + ":" + issue[:volume] + ":" + issue[:issue],
              url: "/uc/#{issue[:unit_id]}/#{issue[:volume]}/#{issue[:issue]}"}]
  elsif pageName == "search"
    # don't add "Search" breadcrumb on Series pages
    return unit.type.include?('series') ? [] : [{ name: "Search", id: unit.id + ":" + pageName}]
  else
    p = Page.where(unit_id: unit.id, slug: pageName).first
    p or halt(404, "Unknown page #{pageName} in #{unit.id}")
    return [{ name: p[:name], id: unit.id + ":" + pageName,
              url: unit.type == "root" ? "/#{pageName}" : "/uc/#{unit.id}/#{pageName}" }]
  end
end

# Returns array of a journal issue's IDs, only for published issues
def getIssueIds (unit)
  if unit.type == 'journal'
    return Issue.distinct.select(Sequel[:issues][:id]).
      join(:sections, issue_id: :id).
      join(:items, section: Sequel[:sections][:id]).
      filter(Sequel[:issues][:unit_id] => unit.id,
             Sequel[:items][:status] => 'published').map { |h| h[:id] }
  else
    return nil
  end
end

# Takes array of issue IDs and returns query
def _queryIssues(publishedIssues)
  return Sequel::SQL::PlaceholderLiteralString.new('SELECT * FROM issues WHERE ((id in ?) AND ((volume != "0") OR (issue != "0"))) ORDER BY CAST(volume AS SIGNED) DESC, CAST(issue AS Decimal(6,2)) DESC', [publishedIssues])
end

# Takes array of issue IDs and returns ordered array of all published Issues (vol/issue/date/attrs), including Articles In Press
def getPublishedJournalIssues(publishedIssues)
  query = _queryIssues(publishedIssues)
  r = DB.fetch(query).to_hash(:id).map{|_id, issue|
    h = issue.to_hash
    h[:attrs] and h[:attrs] = JSON.parse(h[:attrs])
    h
  }
  articlesInPress = Issue.where(id: publishedIssues, :volume => '0', :issue => '0').to_hash(:id).map{|_id, issue|
    h = issue.to_hash
    h[:attrs] and h[:attrs] = JSON.parse(h[:attrs])
    h
  }
  r.unshift(articlesInPress[0]) if articlesInPress[0]
  return r 
end

# Generate breadcrumb and header content for Unit-branded pages
def getUnitHeader(unit, pageName=nil, journalIssue=nil, issuesSubNav=nil, attrs=nil)
  if !attrs then attrs = JSON.parse(unit[:attrs]) end
  campusID = getCampusId(unit)
  ancestor = isTopmostUnit(unit) ? nil : getUnitAncestor(unit)
  ancestorattrs = isTopmostUnit(unit) ? nil: JSON.parse(ancestor.attrs)
  header = {
    :campusID => campusID,
    :campusName => $unitsHash[campusID].name,
    :ancestorID => ancestor ? ancestor.id : nil,   # Used strictly for linking series back to parent unit
    :ancestorName => ancestor ? ancestor.name : nil,   # Ditto 
    :campuses => $activeCampuses.values.map { |c| {id: c.id, name: c.name} }.unshift({id: "", name: "eScholarship at..."}),
    :logo => (unit.type.include? 'series') ? getLogoData(ancestorattrs['logo']) : getLogoData(attrs['logo']),
    :bgColor => (unit.type.include? 'series') ? ancestorattrs['bgColor'] : attrs['bgColor'],
    :elColor => (unit.type.include? 'series') ? ancestorattrs['elColor'] : attrs['elColor'],
    :directSubmit => attrs['directSubmit'],
    :directSubmitURL => attrs['directSubmitURL'],
    :directManageURLauthor => attrs['directManageURLauthor'],
    :directManageURLeditor => attrs['directManageURLeditor'],
    :nav_bar => unit.type.include?('series') ? getNavBar(ancestor, ancestorattrs['nav_bar']) : getNavBar(unit, attrs['nav_bar'], 1, issuesSubNav),
    :social => {
      :facebook => attrs['facebook'],
      :twitter => attrs['twitter'],
      :rss => "/rss/unit/#{unit.id}"
    },
    :breadcrumb => (unit.type!='campus') ?
      traverseHierarchyUp([{name: unit.name, id: unit.id, url: unit.type == "root" ? "/" : "/uc/#{unit.id}"}]) +
        getPageBreadcrumb(unit, pageName, journalIssue)
      : getPageBreadcrumb(unit, pageName)
  }
  # if this unit doesn't have a nav_bar, get the next unit up the hierarchy's nav_bar
  if !header[:nav_bar] and unit.type != 'campus' and unit.type != 'root'
    until header[:nav_bar] || ancestor.id == 'root'
      header[:nav_bar] = JSON.parse(ancestor[:attrs])['nav_bar']
      ancestor = $hierByUnit[ancestor.id][0].ancestor
    end
  end

  return header
end

def getCampusHero
  # Get a random hero image
  heros = $activeCampuses.values.map do |c|
    unit = $unitsHash[c.id]
    attrs = JSON.parse(unit.attrs)
    ["ucop", "lbnl", "anrcs"].include?(c.id) ? nil : {'unit_id': c.id, 'unit_name': c.name, 'hero': getLogoData(attrs['hero'])}
  end.compact.shuffle[0]
end

# Series use query and Journals use issueIds and issuesPublished
def getUnitPageContent(unit:, attrs:, query:, issueIds:, issuesPublished:)
  if unit.type == 'oru'
   return getORULandingPageData(unit.id)
  elsif unit.type == 'campus'
    return getCampusLandingPageData(unit, attrs)
  elsif unit.type.include? 'series'
    return getSeriesLandingPageData(unit, query)
  elsif unit.type == 'journal'
    return getJournalIssueData(unit, attrs, issueIds, issuesPublished)
  else
    # ToDo: handle 'special' type here
    halt(404, "Unknown unit type #{unit.type}")
  end
end

def getUnitMarquee(unit, attrs)
  carousel = Widget.where(unit_id: unit.id, region: "marquee", kind: "Carousel", ordering: 0).first
  if carousel && carousel.attrs
    carouselAttrs = JSON.parse(carousel.attrs)
  else
    carouselAttrs = nil
  end
  return {
    :about => attrs['about'],
    :carousel => attrs['carousel'],
    :slides => (!carouselAttrs || carouselAttrs['slides'] == "") ? nil : carouselAttrs['slides']
  }
end

# Unit builder data
def getUnitBuilderData(unit)
  getUserPermissions(params[:username], params[:token], unit.id)[:admin] or halt(401)
  return {
    sub_units: UnitHier.where(ancestor_unit: unit.id, is_direct: true).order(:ordering).map { |u|
                {id: u.unit_id, name: u.unit.name, type: u.unit.type} },
    parent_units: UnitHier.where(unit_id: unit.id, is_direct: true).map { |u|
                {id: u.ancestor_unit, name: $unitsHash[u.ancestor_unit].name, type: $unitsHash[u.ancestor_unit].type} }
  }
end

# Department Landing Page
# Grab data about: related series (children), related journals (children)
#   and related ORUs, which include children ORUs, sibling ORUs, and parent ORU
def getORULandingPageData(id)
  children = $hierByAncestor[id]
  children and children.select! { |u| u.unit.status != 'hidden' }
  oru_children = children ? children.select { |u| u.unit.type == 'oru' }.map { |u| {unit_id: u.unit_id, name: u.unit.name, ordering:u.ordering} }.sort_by{|u| u[:ordering]}: []
  oru_siblings, oru_ancestor = [], []
  oru_ancestor_id = $oruAncestors[id]
  if oru_ancestor_id
    oru_ancestor = [{unit_id: oru_ancestor_id, name: $unitsHash[oru_ancestor_id].name}]
    siblings = $hierByAncestor[oru_ancestor_id]
    siblings and siblings.select! { |u| u.unit.status != 'hidden' }
    oru_siblings = siblings ? siblings.select { |u| u.unit.type == 'oru' and u.unit_id != id }.map { |u| {unit_id: u.unit_id, name: u.unit.name, ordering:u.ordering} }.sort_by{|u| u[:ordering]} : []
  end
  related_orus = oru_children + oru_siblings + oru_ancestor

  return {
    :series => children ? children.select { |u| u.unit.type == 'series' }.map { |u| seriesPreview(u) }.sort_by{|u| u[:ordering]} : [],
    :monograph_series => children ? children.select { |u| u.unit.type == 'monograph_series' }.map { |u| seriesPreview(u) } : [],
    :journals => children ? children.select { |u| u.unit.type == 'journal' }.map { |u| {unit_id: u.unit_id, name: u.unit.name} } : [],
    :related_orus => related_orus 
  }
end

# Retrieve items from DB based on Campus Carousel configuration that has been set
# Return nil if empty
# content_attrs looks somethign like this: 
#            {"mode": "journals", "unit_id": "arf"}  <---  unit_id not used in this case since it's a journal
#  or this:  {"mode": "unit", "unit_id": "arf"} 
def getCampusCarousel(campus, content_attrs)
  r = nil 
  return nil if campus.type != 'campus' || content_attrs['mode'] == 'disabled'

  if content_attrs['mode'] == 'journals'
    # Populate Campus Carousel with up to 10 Journals
    journals  = $campusJournals.select{ |j| j[:ancestor_unit].include?(campus.id) }
                  .select{ |h| h[:status]!="archived" }.map{|u| {unit_id: u[:id], name: u[:name]} }
    return nil if journals.nil?
    journals_w_issues = Issue.distinct.select(:unit_id).where(unit_id: journals.map{|u| u[:unit_id]}).map { |u| {unit_id: u.unit_id}}
    return nil if journals_w_issues.nil?
    journals.keep_if { |x| journals_w_issues.any? {|y| y[:unit_id] == x[:unit_id]} }
    journals_covers = journals.map { |u|
      i = Issue.where(:unit_id => u[:unit_id]).where(Sequel.lit("attrs->\"$.cover\" is not null"))
               .order(Sequel.desc(:published)).order_append(Sequel.desc(Sequel[:issue].cast_numeric)).first
      if i
        u[:cover] = JSON.parse(i[:attrs])['cover']
      end
      next u 
    }
    r = {'titleID': campus.id, 'titleName': campus.name}
    r['slides'] = journals_covers.compact.take(10)
    r['item_count'] = ($statsJournalCarousel.keys.include? campus.id)  ? $statsJournalCarousel[campus.id][:item_count]     : 0
    r['view_count'] = ($statsJournalCarousel.keys.include? campus.id)  ? $statsJournalCarousel[campus.id][:view_count]     : 0
  elsif content_attrs['mode'] == 'unit'
    # Populate campus carousel with 10 articles from selected unit 
    id = content_attrs['unit_id']
    recentItems = getRecentItems(id, 10)
    if recentItems.length > 0
      unit = $unitsHash[id]
      r = {'titleID': id, 'titleName': unit.name}
      r['slides'] = recentItems
    end
    item_count = ($statsUnitCarousel.keys.include? id)  ? $statsUnitCarousel[id][:item_count]     : 0
    view_count = ($statsUnitCarousel.keys.include? id)  ? $statsUnitCarousel[id][:view_count]     : 0
    # Don't even bother displaying counts if there are no slides. And also don't bother it count is zero
    if r and item_count != 0
        r['item_count'] = item_count
        r['view_count'] = view_count
    end
  else
    r = nil
  end
  return r
end

# Get data for Campus Landing Page
def getCampusLandingPageData(unit, attrs)
  return {
    :hero => getLogoData(attrs['hero']),
    :campusStats => {
      :item_count =>    ($statsCampusItems.keys.include? unit.id)  ? $statsCampusItems[unit.id]     : 0,
      :view_count =>    ($statsCampusViews.keys.include? unit.id)  ? $statsCampusViews[unit.id]     : 0,
      # :opened_count =>    0,
      :journal_count => ($statsCampusJournals.keys.include? unit.id) ? $statsCampusJournals[unit.id] : 0,
      :oru_count =>     ($statsCampusOrus.keys.include? unit.id)  ? $statsCampusOrus[unit.id]     : 0,
    },
    :allStats => {
      :all_item_count =>   $statsCountItems,
      :all_view_count =>   $statsCountViews,
      # :all_opened_count => 0, 
      :all_journal_count => $statsCountEscholJournals,
      :all_oru_count =>    $statsCountOrus,
    },
    :contentCar1 => attrs['contentCar1'] ? {'mode': attrs['contentCar1']['mode'], 'data': getCampusCarousel(unit, attrs['contentCar1'])} : nil,
    :contentCar2 => attrs['contentCar2'] ? {'mode': attrs['contentCar2']['mode'], 'data': getCampusCarousel(unit, attrs['contentCar2'])} : nil
  }
end

# Preview of Series for a Department Landing Page
def seriesPreview(u)
  items = Item.join(:unit_items, :item_id => :id).where(unit_id: u.unit_id).where(status: 'published')
  count = items.count
  previewLimit = 3
  preview = items.limit(previewLimit).map(:item_id)
  itemData = readItemData(preview)

  {
    :unit_id => u.unit_id,
    :name => u.unit.name,
    :count => count,
    :previewLimit => previewLimit,
    :items => itemResultData(preview, itemData),
    :ordering => u.ordering
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

# Get everything about an issue
# issueIds represent ids of all published issues for given unit_id
def _getIssue(unit_id, issueIds, volume=nil, issue=nil, display)
  if volume.nil?  # Landing page (most recent journal) has no vol/issue entered in URL path
    i = DB.fetch(_queryIssues(issueIds))
    i = i.nil? ? nil : i.first
    return nil if i.nil?
  else
    i = Issue.first(:unit_id => unit_id, :volume => volume, :issue => issue)
    return nil if i.nil?
    i = i.values
  end
  if i[:attrs]
    attrs = JSON.parse(i[:attrs])
    attrs['numbering']   and i[:numbering] = attrs['numbering']
    attrs['title']       and i[:title] = attrs['title']
    attrs['description'] and i[:description] = attrs['description']
    attrs['cover']       and i[:cover] = attrs['cover']
    attrs['rights']      and i[:rights] = attrs['rights']
    attrs['buy_link']    and i[:buy_link] = attrs['buy_link']
  end
  i[:sections] = Section.where(:issue_id => i[:id]).order(:ordering).all

  i[:sections].map! do |section|
    section = section.values
    items = Item.where(:section=>section[:id]).
                 where(status: 'published').
                 order(:ordering_in_sect).to_hash(:id)
    itemIds = items.keys
    authors = ItemAuthors.where(item_id: itemIds).order(:ordering).to_hash_groups(:item_id)
    editors = ItemContrib.where(item_id: itemIds, role: 'editor').order(:ordering).to_hash_groups(:item_id)
    advisors = ItemContrib.where(item_id: itemIds, role: 'advisor').order(:ordering).to_hash_groups(:item_id)

    itemData = {items: items, authors: authors, editors: editors, advisors: advisors}
    # Additional data field needed ontop of default
    resultsListFields = (display != "magazine") ? ['thumbnail'] : []
    section[:articles] = itemResultData(itemIds, itemData, resultsListFields)

    next section
  end
  return i 
end

# Landing page data does not pass arguments volume/issue. It just gets most recent journal
def getJournalIssueData(unit, unit_attrs, issueIds, issuesPublished, volume=nil, issue=nil)
  display = unit_attrs['magazine_layout'] ? 'magazine' : 'simple'
  if unit_attrs['issue_rule'] and unit_attrs['issue_rule'] == 'secondMostRecent' and volume.nil? and issue.nil?
    secondIssue = issuesPublished.first(2)[1]
    volume = secondIssue ? secondIssue[:volume] : nil
    issue = secondIssue ? secondIssue[:issue] : nil
  end
  return {
    display: display,
    issue: _getIssue(unit.id, issueIds, volume, issue, display),
    doaj: unit_attrs['doaj'],
    issn: unit_attrs['issn'],
    eissn: unit_attrs['eissn']
  }
end

def isJournalIssue?(unit_id, volume, issue)
  !!Issue.first(:unit_id => unit_id, :volume => volume, :issue => issue)
end

# Returns pair: 'numbering' setting and title for custom breadcrumb on item pages
def getIssueNumberingTitle(unit_id, volume, issue)
  i = Issue.first(:unit_id => unit_id, :volume => volume, :issue => issue)
  return nil, nil if i.nil?
  i = i.values
  return nil, nil if i[:attrs].nil?
  attrs = JSON.parse(i[:attrs])
  return attrs['numbering'], attrs['title'], attrs['show_pub_dates']
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

  aws_params = aws_encode(params, [], "items")
  response = normalizeResponse($csClient.search(return: '_no_fields', **aws_params))

  if response['hits'] && response['hits']['hit']
    itemIds = response['hits']['hit'].map { |item| item['id'] }
    itemData = readItemData(itemIds)
    searchResults = itemResultData(itemIds, itemData, resultsListFields)
  end

  return {'count' => response['hits']['found'], 'query' => get_query_display(params.clone), 'searchResults' => searchResults}
end

def getUnitStaticPage(unit, _attrs, pageName)
  page = Page[:slug=>pageName, :unit_id=>unit.id]
  page or jsonHalt(404, "unknown page #{pageName}")
  page = page.values
  page[:attrs] = JSON.parse(page[:attrs])
  return page
end

def getUnitProfile(unit, attrs)
  getUserPermissions(params[:username], params[:token], unit.id)[:admin] or halt(401)
  profile = {
    name: unit.name,
    slug: unit.id,
    logo: attrs['logo'],
    bgColor: attrs['bgColor'] || '#ffffff',
    elColor: attrs['elColor'] || 'black',
    facebook: attrs['facebook'],
    twitter: attrs['twitter'],
    marquee: getUnitMarquee(unit, attrs),
    status: unit.status
  }
  
  attrs['directSubmit'] and profile[:directSubmit] = attrs['directSubmit']
  attrs['directSubmitURL'] and profile[:directSubmitURL] = attrs['directSubmitURL']
  attrs['directManageURLauthor'] and profile[:directManageURLauthor] = attrs['directManageURLauthor']
  attrs['directManageURLeditor'] and profile[:directManageURLeditor] = attrs['directManageURLeditor']
  attrs['elements_id'] and profile[:elementsID] = attrs['elements_id']
  if unit.type == 'journal'
    profile[:doaj] = attrs['doaj']
    profile[:issn] = attrs['issn']
    profile[:eissn] = attrs['eissn']
    profile[:altmetrics_ok] = attrs['altmetrics_ok']
    profile[:magazine_layout] = attrs['magazine_layout']
    profile[:issue_rule] = attrs['issue_rule']
    
    profile[:indexed] = attrs['indexed'] || []
    profile[:tos] = attrs['tos'] || ''
    profile[:disciplines] = attrs['disciplines'] || []
    profile[:pub_freq] = attrs['pub_freq'] || ''
    profile[:oaspa] = attrs['oaspa'] || ''
    profile[:apc] = attrs['apc'] || ''
    profile[:contentby] = attrs['contentby'] || []
  end
  if unit.type =~ /series|journal/
    profile[:commenting_ok] = attrs['commenting_ok']
  end
  if unit.type == 'oru'
    profile[:seriesSelector] = true
  end
  if unit.type == 'campus'
    profile[:hero] = attrs['hero']
  end
   
  #puts "====profile passed: profile=#{profile}"
  return profile
end

def getUnitCarouselConfig(unit, attrs)
  getUserPermissions(params[:username], params[:token], unit.id)[:admin] or halt(401)
  config = {
    marquee: getUnitMarquee(unit, attrs)
  }
  if unit.type == 'campus'
    cu = flattenDepts($hierByAncestor[unit.id].map(&:values).map{|x| x[:unit_id]})
    config[:campusUnits] = cu.sort_by{ |u| u["name"] }
    topmostUnit = config[:campusUnits].length > 0 ? config[:campusUnits][0]['id'] : nil
    emptyConfig = {"mode": "disabled", "unit_id": ""}
    config[:contentCar1] = topmostUnit ? 
        attrs['contentCar1'] ?
          attrs['contentCar1']
        : {"mode": "unit", "unit_id": topmostUnit}
      : emptyConfig
    config[:contentCar2] = topmostUnit ? 
        attrs['contentCar2'] ?
          attrs['contentCar2']
        : {"mode": "journals", "unit_id": topmostUnit}
      : emptyConfig
  end
  return config 
end

def getItemAuthors(itemID)
  return ItemAuthors.filter(:item_id => itemID).order(:ordering).map(:attrs).collect{ |h| JSON.parse(h)}
end

def getItemEditors(itemID)
  return ItemContrib.filter(:item_id => itemID, :role => 'editor').order(:ordering).map(:attrs).collect{ |h| JSON.parse(h)}
end

def getItemAdvisors(itemID)
  return ItemContrib.filter(:item_id => itemID, :role => 'advisor').order(:ordering).map(:attrs).collect{ |h| JSON.parse(h)}
end

# Get recent items (with author info) given a unit ID, by most recent added date
# Pass an item id in if you don't want that item included in results
# This query takes a while, so we cache the results
def getRecentItems(unitID, limit=5, item_id=nil)
  cacheKey = "#{unitID}|#{limit}"
  $recentItems[cacheKey] ||= Item.join(:unit_items, :item_id => :id)
                                 .where(unit_id: unitID)
                                 .where(status: 'published')
                                 .reverse(:added).limit(limit+1)  # so we can filter out one item by id later
                                 .select(:id)
                                 .map { |item| item.id }
  return Item.where(id: $recentItems[cacheKey].select{ |id| id != item_id }[0,limit]).map { |item|
    { id: item.id, title: item.title, authors: getItemAuthors(item.id), genre: item.genre,
      author_hide: JSON.parse(item.attrs)["author_hide"], editors: getItemEditors(item.id), advisors: getItemAdvisors(item.id) }
  }
end

# Instead of related items, for now, this just grabs most recent items (very similar to getUnitSidebar)
# For now, represents the entire sidebar component for Item Pages
def getItemRelatedItems(unit, item_id)
  return [{ id: 1, kind: "RecentArticles", attrs: {'items': getRecentItems(unit.id, 5, item_id), 'title': 'Related Items'}}]
end

def getUnitSidebar(unit)
  return Widget.where(unit_id: unit.id, region: "sidebar").order(:ordering).map { |widget|
    attrs =  widget[:attrs] ? JSON.parse(widget[:attrs]) : {}
    widget[:kind] == "RecentArticles" and attrs[:items] = getRecentItems(unit.id, 5)
    next { id: widget[:id], kind: widget[:kind], attrs: attrs }
  }
end

def getUnitSidebarWidget(unit, widgetID)
  getUserPermissions(params[:username], params[:token], unit.id)[:admin] or halt(401)
  widget = Widget[widgetID]
  widget.unit_id == unit.id && widget.region == "sidebar" or jsonHalt(400, "invalid widget")
  return { id: widget[:id], kind: widget[:kind], attrs: widget[:attrs] ? JSON.parse(widget[:attrs]) : {} }
end

# Traverse the nav bar, including sub-folders, yielding each item in turn
# to the supplied block.
def travNav(navBar, &block)
  navBar.each { |nav|
    block.yield(nav)
    if nav['type'] && nav['type'].include?('folder')
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
      # Check for 'folder'    (You would never want to delete a 'fixed_folder')
      : nav['type'] == "folder" ? nav.merge({'sub_nav'=>deleteNavByID(nav['sub_nav'], navID) })
      : nav
  }.compact
end

def getUnitNavConfig(unit, navBar, navID)
  getUserPermissions(params[:username], params[:token], unit.id)[:admin] or halt(401)
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
  puts "jsonHalt: code=#{httpCode} message=#{message.inspect}"
  content_type :json
  halt(httpCode, { error: true, message: message }.to_json)
end

put "/api/unit/:unitID/nav/:navID" do |unitID, navID|
  # Check user permissions
  userPerms = getUserPermissions(params[:username], params[:token], unitID)
  userPerms[:admin] or halt(401)
  content_type :json

  DB.transaction {
    unit = Unit[unitID] or jsonHalt(404, "Unit not found")
    unitAttrs = JSON.parse(unit.attrs)
    params[:name].empty? and jsonHalt(400, "Page name must be supplied.")
    navPerms = getNavPerms(unit, unitAttrs["nav_bar"], userPerms)

    travNav(unitAttrs['nav_bar']) { |nav|
      next unless nav['id'].to_s == navID.to_s
      nav['name'] = params[:name]
      params[:hidden].to_s == "true" ? nav['hidden'] = true : nav.delete('hidden')
      if nav['type'] == "page"
        page = Page.where(unit_id: unitID, slug: nav['slug']).first or halt(404, "Page not found")

        oldSlug = page.slug
        if navPerms[oldSlug][:change_slug]
          newSlug = params[:slug]
          newSlug.empty? and jsonHalt(400, "Slug must be supplied.")
          newSlug =~ /^[a-zA-Z][a-zA-Z0-9_]+$/ or jsonHalt(400,
            message: "Slug must start with a letter a-z, and consist only of letters a-z, numbers, or underscores.")
          page.slug = newSlug
          nav['slug'] = newSlug
        end

        page.name = params[:name]
        page.name.empty? and jsonHalt(400, "Page name must be supplied.")

        page.title = params[:title]
        page.title.empty? and jsonHalt(400, "Title must be supplied.")

        if navPerms[oldSlug][:change_text]
          newHTML = sanitizeHTML(params[:attrs][:html])
          newHTML.gsub(%r{</?p>}, '').gsub(/\s|\u00a0/, '').empty? and jsonHalt(400, "Text must be supplied.")
          page.attrs = JSON.parse(page.attrs).merge({ "html" => newHTML }).to_json
        end
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
  newOrder = newOrder.map { |stub| stub['id'] <= 0 ? nil : stub }.compact
  return newOrder.map { |stub|
    source = getNavByID(oldNav, stub['id'])
    source or raise("Unknown nav id #{stub['id']}")
    newNav = source.clone
    if source['type'].include?("folder")
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
  userPerms = getUserPermissions(params[:username], params[:token], unitID)
  userPerms[:admin] or halt(401)

  # Grab unit data
  unit = Unit[unitID]
  unit or halt(404)

  # Validate the nav type. ('fixed_page' and 'fixed_folder' can't be added)
  navType = params[:navType]
  ['page', 'link', 'folder'].include?(navType) or halt(400)

  # Find the existing nav bar
  attrs = JSON.parse(unit.attrs)
  (navBar = attrs['nav_bar']) or raise("Unit has non-existent nav bar")

  # Make sure the user has permission. "remove" permission is a good proxy for "add"
  getNavPerms(unit, attrs["nav_bar"], userPerms).dig('page', :remove) or restrictedHalt

  # Invent a unique name for the new item
  slug = name = nil
  (1..9999).each { |n|
    slug = "#{navType}#{n}"
    name = "New #{navType} #{n}"
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
      newNav = { id: nextID, type: "page", name: name, slug: slug }
    when "link"
      newNav = { id: nextID, type: "link", name: name, url: "" }
    when "folder"
      newNav = { id: nextID, type: "folder", name: name, sub_nav: [] }
    else
      halt(400, "unknown navType")
    end

    navBar.insert(0, newNav)
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
  ['RecentArticles', 'Text', 'TwitterFeed'].include?(widgetKind) or jsonHalt(400, "Invalid widget kind")

  # Initial attributes are kind-specific
  attrs = case widgetKind
  when "Text"
    { title: "New #{widgetKind}", html: "" }
  when "TwitterFeed"
    { title: "Follow Us On Twitter", twitter_handle: "" }
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
    Widget.where(unit_id: unitID, region: "sidebar").count == newOrder.length or jsonHalt(400, "must reorder all at once")

    # Make two passes, to absolutely avoid conflicting order in the table at any time.
    maxOldOrder = Widget.where(unit_id: unitID, region: "sidebar").max(:ordering)
    (1..2).each { |pass|
      offset = (pass == 1) ? maxOldOrder+1 : 1
      newOrder.each_with_index { |widgetID, idx|
        w = Widget[widgetID]
        w.unit_id == unitID or jsonHalt(400, "widget/unit mistmatch")
        # Only super users can change order of campus contact
        if w.ordering != idx+offset && JSON.parse(w.attrs)['title'] == "Campus Contact" && !perms[:super]
          restrictedHalt
        end
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
    # Only super users can delete campus contact block
    if JSON.parse(widget.attrs)['title'] == "Campus Contact" && !perms[:super]
      restrictedHalt
    end
    widget.unit_id == unitID and widget.region == "sidebar" or jsonHalt(400, "invalid widget")
    widget.delete
  }

  content_type :json
  return {status: "ok", nextURL: unitID=="root" ? "/" : "/uc/#{unitID}" }.to_json
end

###################################################################################################
# Gather data for redirect view/edit
def getRedirectData(kind)
  getUserPermissions(params[:username], params[:token], 'root')[:super] or halt(401)
  return { kind: kind,
           redirects: Redirect.where(kind: kind).order(:id).all.map { |record| record.to_hash }
         }
end

###################################################################################################
def validateURL(url, allowExternal)
  url.nil? and jsonHalt(400, "Missing URL")
  url.include?("..") and jsonHalt(400, "Invalid URL")
  # Strip hostname from eschol URLs
  url.sub!(%r{https?://(pub-jschol[^\.]+\.|www\.|beta\.)?escholarship.org/?([^"]*)}, '/\2')
  url =~ (allowExternal ? %r{^(/|https?://).*} : %r{^/}) or jsonHalt(400, "Invalid URL")
  return url
end

###################################################################################################
# Add a new unit
put "/api/unit/:unitID/unitBuilder" do |parentUnitID|
  # Only super-users allowed to add units
  getUserPermissions(params[:username], params[:token], parentUnitID)[:super] or halt(401)

  newUnitID = params[:newUnitID]
  newUnitID =~ /^[a-z0-9_]+$/ or jsonHalt(400, "Invalid unit ID")
  Unit[newUnitID].nil? or jsonHalt(400, "Duplicate unit ID")

  unitName = params[:name]
  unitName.nil? || unitName.empty? and jsonHalt(400, "Invalid unit name")

  unitType = params[:type]
  %w{oru journal series monograph_series}.include?(unitType) or jsonHalt(400, "Invalid unit type")

  isHidden = !!params[:hidden]

  # Add a basic nav bar. Fixed/immovable nav buttons "__ Home" (and "Issues" dropdown for journals) will be included in the nav by default (called up when page is being rendered)
  attrs = {
    about: "About #{unitName}: TODO",
    nav_bar: %w{oru journal}.include?(unitType) ? [
      { id: 1, name: "About", slug: "about", type: "page" },
      { id: 2, name: "Contact us", slug: "contact", type: "page" }
    ] : []
  }

  DB.transaction {
    Unit.create(id: newUnitID,
                name: unitName,
                type: unitType,
                status: isHidden ? "hidden" : "active",
                attrs: attrs.to_json)

    if %w{oru journal}.include?(unitType)
      Page.create(unit_id: newUnitID,
                  name: "About",
                  title: "About #{unitName}",
                  slug: "about",
                  attrs: { html: "" }.to_json)
      Page.create(unit_id: newUnitID,
                  name: "Contact us",
                  title: "Contact us",
                  slug: "contact",
                  attrs: { html: "" }.to_json)
    end

    maxExisting = UnitHier.where(ancestor_unit: parentUnitID, is_direct: 1).max(:ordering)
    UnitHier.create(unit_id: newUnitID,
                    ancestor_unit: parentUnitID,
                    ordering: maxExisting.nil? ? 1 : maxExisting+1,
                    is_direct: true)
    UnitHier.where(unit_id: parentUnitID).each { |hier|
      UnitHier.create(unit_id: newUnitID,
                      ancestor_unit: hier.ancestor_unit,
                      is_direct: false)
    }
  }
  refreshUnitsHash
  return {status: "ok", nextURL: "/uc/#{newUnitID}"}.to_json
end

###################################################################################################
# Adopt an existing unit as a sub-unit
put "/api/unit/:unitID/adoptUnit" do |parentUnitID|
  # Only super-users allowed to adopt units
  getUserPermissions(params[:username], params[:token], parentUnitID)[:super] or halt(401)

  existingUnitID = params[:existingUnitID]
  Unit[existingUnitID] or jsonHalt(400, "Unknown unit ID")

  DB.transaction {
    maxExisting = UnitHier.where(ancestor_unit: parentUnitID, is_direct: 1).max(:ordering)
    UnitHier.create(unit_id: existingUnitID,
                    ancestor_unit: parentUnitID,
                    ordering: maxExisting.nil? ? 1 : maxExisting+1,
                    is_direct: true)
    UnitHier.where(unit_id: parentUnitID).each { |hier|
      begin
        UnitHier.create(unit_id: existingUnitID,
                        ancestor_unit: hier.ancestor_unit,
                        is_direct: false)
      rescue
        puts "Skipping hier create for unit=#{existingUnitID} ancestor=#{hier.ancestor_unit}"
      end
    }
  }
  refreshUnitsHash
  return {status: "ok"}.to_json
end

###################################################################################################
# Disown a sub-unit (must have at least one other parent)
put "/api/unit/:unitID/disownUnit" do |parentUnitID|
  # Only super-users allowed to disown units
  getUserPermissions(params[:username], params[:token], parentUnitID)[:super] or halt(401)

  existingUnitID = params[:existingUnitID]
  Unit[existingUnitID] or jsonHalt(400, "Unknown unit ID")
  UnitHier.where(ancestor_unit: parentUnitID, unit_id: existingUnitID, is_direct: 1).empty? and jsonHalt(400, "Unit is not a child")
  UnitHier.where(unit_id: existingUnitID, is_direct: 1).count >= 2 or jsonHalt(400, "Unit would be orphaned")

  DB.transaction {
    UnitHier.where(unit_id: existingUnitID, ancestor_unit: parentUnitID, is_direct: 1).delete
    rebuildIndirectLinks(parentUnitID)
    rebuildIndirectLinks(existingUnitID)
  }
  refreshUnitsHash
  return {status: "ok"}.to_json
end

###################################################################################################
# Re-order units
put "/api/unit/:unitID/unitOrder" do |unitID|
  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], unitID)[:super] or restrictedHalt
  content_type :json

  DB.transaction {
    unit = Unit[unitID] or jsonHalt(404, "Unit not found")
    newOrder = JSON.parse(params[:order])
    UnitHier.where(ancestor_unit: unitID, is_direct: true).count == newOrder.length or jsonHalt(400, "must reorder all at once")

    # Make two passes, to absolutely avoid conflicting order in the table at any time.
    maxOldOrder = UnitHier.where(ancestor_unit: unitID, is_direct: true).max(:ordering)
    (1..2).each { |pass|
      offset = (pass == 1) ? maxOldOrder+1 : 1
      newOrder.each_with_index { |childID, idx|
        h = UnitHier.where(ancestor_unit: unitID, unit_id: childID, is_direct: true).first
        h.ordering = idx + offset
        h.save
      }
    }
    return {status: "ok"}.to_json
  }
end

###################################################################################################
# Rebuild the indirect hierarchy links for the unit and its items. Recursively processes sub-units
# as well.
def rebuildIndirectLinks(unitID, hier = nil)
  # Cache the direct hierarchy
  hier ||= UnitHier.filter(is_direct: true).to_hash_groups(:unit_id, :ancestor_unit)

  # Reconstruct indirect unit links. Handle possible multiple parents.
  done = Set.new
  UnitHier.where(unit_id: unitID, is_direct: false).delete
  queue = UnitHier.where(unit_id: unitID, is_direct: true).select_map(:ancestor_unit).map{ |p| hier[p] }.flatten
  while !queue.empty?
    p = queue.shift
    next if done.include?(p)
    UnitHier.create(unit_id: unitID, ancestor_unit: p, is_direct: false)
    done << p
    hier[p] and queue += hier[p]
  end

  # Rebuild indirect item links in similar fashion.
  UnitItem.where(unit_id: unitID, is_direct: true).select_map(:item_id).each { |itemID|
    done = Set.new
    UnitItem.where(item_id: itemID, is_direct: false).delete
    queue = UnitItem.where(item_id: itemID, is_direct: true).select_map(:unit_id).map{ |p| hier[p] }.flatten
    lastOrder = 10000
    while !queue.empty?
      p = queue.shift
      next if done.include?(p)
      UnitItem.create(item_id: itemID, unit_id: p, ordering_of_units: lastOrder+1, is_direct: false)
      lastOrder += 1
      done << p
      hier[p] and queue += hier[p]
    end
  }

  # Recursively process sub-units
  UnitHier.where(ancestor_unit: unitID, is_direct: true).select_map(:unit_id).each { |kid|
    rebuildIndirectLinks(kid, hier)
  }
end

###################################################################################################
# Switch unit to a new parent
put "/api/unit/:unitID/moveUnit" do |unitID|
  # Only super-users allowed to move units
  getUserPermissions(params[:username], params[:token], unitID)[:super] or halt(401)

  # Sanity checks
  %w{campus root}.include?($unitsHash[unitID].type) and jsonHalt(400, "Cannot move top-level units.")
  targetUnitID = params[:targetUnitID]
  targetUnit = $unitsHash[targetUnitID] or jsonHalt(400, "Unrecognized target unit")
  targetUnit.type =~ /series|journal/ and jsonHalt(400, "Destination parent unit cannot be a series or journal")

  # Get the max ordering of the new parent's existing children.
  lastOrder = UnitHier.where(ancestor_unit: targetUnitID, is_direct: true).max(:ordering) || 0

  DB.transaction {
    # Change the primary direct link
    oldParent = UnitHier.where(unit_id: unitID, is_direct: true).order(:ordering).last[:ancestor_unit]
    UnitHier.where(unit_id: unitID, ancestor_unit: targetUnitID, is_direct: false).delete # if already descendant
    UnitHier.where(unit_id: unitID, ancestor_unit: oldParent, is_direct: true).
             update(ancestor_unit: targetUnitID, ordering: lastOrder+1)

    # And rebuild all the indirect links
    #puts "Unit hier before:\n#{UnitHier.where(unit_id: unitID).all.map { |h| "  #{h.to_hash.to_s}" }.sort.join("\n")}"
    #puts "Item hier before:\n#{UnitItem.where(item_id: UnitItem.where(unit_id: unitID).order(:item_id).
    #  select_map(:item_id)).all.map { |h| "  #{h.to_hash.to_s}" }.join("\n")}"
    rebuildIndirectLinks(unitID)
    #puts "Unit hier after:\n#{UnitHier.where(unit_id: unitID).all.map { |h| "  #{h.to_hash.to_s}" }.sort.join("\n")}"
    #puts "Item hier after:\n#{UnitItem.where(item_id: UnitItem.where(unit_id: unitID).order(:item_id).
    #  select_map(:item_id)).all.map { |h| "  #{h.to_hash.to_s}" }.join("\n")}"

    #raise Sequel::Rollback  # for testing only
  }
  refreshUnitsHash
  return {status: "ok"}.to_json
end

###################################################################################################
# Delete a unit and its pages, widgets, etc.
put "/api/unit/:unitID/deleteUnit" do |unitID|
  # Only super-users allowed to move units
  getUserPermissions(params[:username], params[:token], unitID)[:super] or halt(401)

  # Sanity checks
  UnitHier.where(ancestor_unit: unitID).count > 0 and jsonHalt(400, "Cannot delete unit having sub-units.")
  UnitItem.where(unit_id: unitID).count > 0 and jsonHalt(400, "Cannot delete unit containing items.")

  DB.transaction {
    UnitHier.where(unit_id: unitID).delete
    Page.where(unit_id: unitID).delete
    Widget.where(unit_id: unitID).delete
    UnitStat.where(unit_id: unitID).delete
    UnitCount.where(unit_id: unitID).delete
    CategoryStat.where(unit_id: unitID).delete
    Unit.where(id: unitID).delete
  }
  refreshUnitsHash
  return {status: "ok", nextURL: "/uc/#{$hierByUnit[unitID][0].ancestor_unit}"}.to_json
end

###################################################################################################
# Copy a unit with its pages, widgets, etc.
put "/api/unit/:unitID/copyUnit" do |oldUnitID|
  # Only super-users allowed to copy units
  getUserPermissions(params[:username], params[:token], oldUnitID)[:super] or halt(401)

  # Sanity checks
  $unitsHash[oldUnitID].type == 'root' and jsonHalt(400, "Cannot copy the root-level unit.")
  targetParentID = params[:targetParentID]
  targetParent = $unitsHash[targetParentID] or jsonHalt(400, "Unrecognized target parent unit")
  targetParent.type =~ /series|journal/ and jsonHalt(400, "Target parent unit cannot be a series or journal")

  newUnitID = params[:newUnitID]
  newUnitID =~ /^[a-z0-9_]+$/ or jsonHalt(400, "Invalid new unit ID")
  Unit.where(id: newUnitID).count == 0 or jsonHalt(400, "Duplicate unit name")

  oldUnit = Unit[oldUnitID] or jsonHalt(400, "Can't find old unit")

  # Get the max ordering of the new parent's existing children.
  lastOrder = UnitHier.where(ancestor_unit: targetParentID, is_direct: true).max(:ordering)

  DB.transaction {
    Unit.create(oldUnit.values.merge({id: newUnitID}))

    UnitHier.create(unit_id: newUnitID, ancestor_unit: targetParentID, ordering: (lastOrder||0)+1, is_direct: true)
    rebuildIndirectLinks(newUnitID)

    Page.where(unit_id: oldUnitID).each { |page|
      props = page.values.merge({unit_id: newUnitID})
      props.delete(:id)
      Page.create(props)
    }
    Widget.where(unit_id: oldUnitID).each { |widget|
      props = widget.values.merge({unit_id: newUnitID})
      props.delete(:id)
      Widget.create(props)
    }
  }
  refreshUnitsHash
  return {status: "ok", nextURL: "/uc/#{newUnitID}"}.to_json
end

###################################################################################################
# Change redirect data
put "/api/redirect/:kind/:redirID" do |kind, redirID|
  getUserPermissions(params[:username], params[:token], 'root')[:super] or halt(401)

  %w{static item unit bepress doj}.include?(kind) or halt(400)
  record = Redirect[redirID] or halt(404)
  record.kind == kind or halt(400)
  record.from_path = validateURL(params[:from_path], false)  # no external
  record.to_path = validateURL(params[:to_path], true)
  record.descrip = params[:descrip].strip
  record.descrip.empty? and record.descrip = nil
  record.save
  refreshStaticRdirects
  return {status: "ok"}.to_json
end

###################################################################################################
# Add a redirect
post "/api/redirect/:kind" do |kind|
  getUserPermissions(params[:username], params[:token], 'root')[:super] or halt(401)

  %w{static item unit bepress doj}.include?(kind) or halt(400)
  Redirect.create(kind: kind,
                  from_path: validateURL(params[:from_path], false), # no external
                  to_path: validateURL(params[:to_path], true),
                  descrip: params[:descrip].strip.empty? ? nil : params[:descrip].strip)
  refreshStaticRdirects
  return {status: "ok"}.to_json
end

###################################################################################################
# Delete a redirect
delete "/api/redirect/:kind/:redirID" do |kind, redirID|
  getUserPermissions(params[:username], params[:token], 'root')[:super] or halt(401)

  record = Redirect[redirID] or halt(404)
  record.kind == kind or halt(400)
  record.delete
  refreshStaticRdirects
  return {status: "ok"}.to_json
end

###################################################################################################
# *Delete* to remove a static page from a unit
delete "/api/unit/:unitID/nav/:navID" do |unitID, navID|
  # Don't allow deletion of 'fixed_' navigation items (which have ids of zero or less)
  navID.to_i > 0 or restrictedHalt
  # Check user permissions
  userPerms = getUserPermissions(params[:username], params[:token], unitID)
  userPerms[:admin] or halt(401)

  DB.transaction {
    unit = Unit[unitID] or halt(404, "Unit not found")
    unitAttrs = JSON.parse(unit.attrs)
    nav = getNavByID(unitAttrs['nav_bar'], navID)
    slug = nav['type'] != 'page' ? nav['type'] : nav['slug']
    getNavPerms(unit, unitAttrs["nav_bar"], userPerms).dig(slug, :remove) or restrictedHalt
    unitAttrs['nav_bar'] = deleteNavByID(unitAttrs['nav_bar'], navID)
    getNavByID(unitAttrs['nav_bar'], navID).nil? or raise("delete failed")
    if nav['type'] == "folder" && !nav['sub_nav'].empty?
      jsonHalt(400, "Can't delete non-empty folder")
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
    inAttrs[:twitter_handle]  and attrs[:twitter_handle]  = inAttrs[:twitter_handle]
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
def restrictedHalt
  jsonHalt(401, "This action is restricted. Contact eScholarship Support for further assistance.")
end

###################################################################################################
# *Put* to change unit profile properties: content configuration
put "/api/unit/:unitID/profileContentConfig" do |unitID|
  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or halt(401)

  DB.transaction {
    unit = Unit[unitID] or jsonHalt(404, "Unit not found")
    unitAttrs = JSON.parse(unit.attrs)
    #puts "DATA received is #{params['data']}"   
    if params['data']['unitName'] then unit.name = params['data']['unitName'] end

    # Only change unit config flags if the that section is being saved -- avoids clearing them accidentally
    if params['data']['unitConfigSection']
      if unitAttrs['logo']
        unitAttrs['logo']['is_banner'] = params['data']['logoIsBanner'] == 'on'
      end

      # Certain elements can only be changed by super user
      if perms[:super]
        unitAttrs['doaj'] = (params['data']['doajSeal'] == 'on')
        unitAttrs['altmetrics_ok'] = (params['data']['altmetrics_ok'] == 'on')
        unitAttrs['commenting_ok'] = (params['data']['commenting_ok'] == 'on')
        %w{active hidden archived}.include?(params['data']['status']) or jsonHalt(400, "invalid status")
        unit.status = params['data']['status']
        %w{enabled disabled moribund}.include?(params['data']['directSubmit']) or jsonHalt(400, "invalid directSubmit")
        if params['data']['directSubmit'] == "enabled"
          unitAttrs.delete('directSubmit')
        else
          unitAttrs['directSubmit'] = params['data']['directSubmit']
        end
        if params['data']['directSubmitURL'] then unitAttrs['directSubmitURL'] = params['data']['directSubmitURL'] end
        if params['data']['directManageURLauthor'] then unitAttrs['directManageURLauthor'] = params['data']['directManageURLauthor'] end
        if params['data']['directManageURLeditor'] then unitAttrs['directManageURLeditor'] = params['data']['directManageURLeditor'] end
        if params['data']['elementsID']
          params['data']['elementsID'] =~ /^[0-9]*$/ or jsonHalt(400, "elements ID must be numeric (or blank)")
          unitAttrs['elements_id'] = params['data']['elementsID']
        end
      end
    end

    # Likewise, only change journal flags if journal section is being saved
    if params['data']['journalConfigSection']
      unitAttrs['magazine_layout'] = (params['data']['magazine_layout'] == "on")
      unitAttrs['issue_rule'] = (params['data']['issue_rule'] == "secondMostRecent") ? "secondMostRecent" : nil
    end

    if params['data']['issn'] then unitAttrs['issn'] = params['data']['issn'] end
    if params['data']['eissn'] then unitAttrs['eissn'] = params['data']['eissn'] end
    # pp(params['data'])
    if params['data']['facebook'] then unitAttrs['facebook'] = params['data']['facebook'] end
    if params['data']['twitter'] then unitAttrs['twitter'] = params['data']['twitter'] end
    if params['data']['about'] then unitAttrs['about'] = params['data']['about'] end
    if params['data']['subheader-bgcolorpicker'] then unitAttrs['bgColor'] = params['data']['subheader-bgcolorpicker'] end
    if params['data']['elementcolorpicker'] then unitAttrs['elColor'] = params['data']['elementcolorpicker'] end

    if params['data']['indexed'] then unitAttrs['indexed'] = params['data']['indexed'] end
    if params['data']['disciplines'] then unitAttrs['disciplines'] = params['data']['disciplines'] end
    if params['data']['pub_freq'] then unitAttrs['pub_freq'] = params['data']['pub_freq'] end
    if params['data']['oaspa'] then unitAttrs['oaspa'] = params['data']['oaspa'] end
    if params['data']['apc'] then unitAttrs['apc'] = params['data']['apc'] end
    if params['data']['contentby'] then unitAttrs['contentby'] = params['data']['contentby'] end
    if params['data']['tos'] then unitAttrs['tos'] = params['data']['tos'] end
    unitAttrs.delete_if {|_k,v| (v.is_a? String and v.empty?) || (v == false) || v.nil? }
    unit.attrs = unitAttrs.to_json
    unit.save
  }

  refreshUnitsHash
  content_type :json
  return { status: "ok" }.to_json
end

###################################################################################################
# *Put* to change unit carousel configuration
put "/api/unit/:unitID/carouselConfig" do |unitID|
  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or halt(401)

  carouselKeys = params['data'].keys.grep(/(header|text)\d+/)
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
    if params['data']['carouselFlag'] && params['data']['carouselFlag'] == 'on'
      unitAttrs['carousel'] = true
    else
      unitAttrs.delete('carousel')
    end
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
    carouselAttrs['slides'] ||= []
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
    carouselAttrs = {slides: nil}
  end
  
  carousel.attrs = carouselAttrs.to_json
  carousel.save
end

def saveImage (name, unitID, data)
  DB.transaction {
    unit = Unit[unitID] or jsonHalt(404, "Unit not found")
    unitAttrs = JSON.parse(unit.attrs)
    isBanner = unitAttrs.dig(name, 'is_banner')
    unitAttrs[name] = data.to_a.collect{|x| [x[0].to_s, x[1]]}.to_h
    isBanner and unitAttrs[name]['is_banner'] = true
    unit.attrs = unitAttrs.to_json
    unit.save
  }
end

post "/api/unit/:unitID/upload" do |unitID|
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or halt(401)

  # upload images for carousel configuration
  slideImageKeys = params.keys.grep(/slideImage/)
  if slideImageKeys.length > 0
    slideImage_data = []
    for slideImageKey in slideImageKeys
      image_data = putImage("slide", params[slideImageKey][:tempfile].path, { original_path: params[slideImageKey][:filename] })
      image_data[:slideNumber] = /slideImage(\d*)/.match(slideImageKey)[1]
      slideImage_data.push(image_data)
    end
    DB.transaction {
      carousel = Widget.where(unit_id: unitID, region: "marquee", kind: "Carousel", ordering: 0).first
      carouselAttrs = JSON.parse(carousel.attrs)
      carouselAttrs['slides'] ||= []
      for slideImage in slideImage_data
        slideNumber = slideImage[:slideNumber].to_i
        image_data = slideImage.reject{|k,_v| k == :slideNumber}.to_a.collect{|x| [x[0].to_s, x[1]]}.to_h
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
    logo_data = putImage("logo", params[:logo][:tempfile].path, { original_path: params[:logo][:filename] })
    saveImage('logo', unitID, logo_data)
  elsif params[:logo] == ""
    #REMOVE LOGO
  end

  # upload images for campus hero
  if params.has_key? :hero and params[:hero] != ""
    hero_data = putImage("hero", params[:hero][:tempfile].path, { original_path: params[:hero][:filename] })
    saveImage('hero', unitID, hero_data)
  elsif params[:hero] == ""
    #REMOVE LOGO
  end

  content_type :json
  return { status: "okay" }.to_json
end

post "/api/unit/:unitID/uploadEditorImg" do |unitID|
  getUserPermissions(params[:username], params[:token], unitID)[:admin] or halt(401)
  img_data = putImage(params[:context], params[:image][:tempfile].path, { original_path: params[:image][:filename] })
  content_type :json
  return { success: true, link: "/cms-assets/#{img_data[:asset_id]}" }.to_json
end

post "/api/unit/:unitID/uploadEditorFile" do |unitID|
  getUserPermissions(params[:username], params[:token], unitID)[:admin] or halt(401)
  assetID = putAsset(params[:file][:tempfile].path, { original_path: params[:file][:filename] })
  content_type :json
  return { success: true, link: "/cms-assets/#{assetID}" }.to_json
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

###################################################################################################
# *Put* to change campus content carousel configuration
put "/api/unit/:campusID/campusCarouselConfig" do |campusID|
  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], campusID)
  perms[:admin] or halt(401)

  DB.transaction {
    unit = Unit[campusID] or jsonHalt(404, "Unit not found")
    unit.type == 'campus' or jsonHalt(404, "This unit is not a campus. Failed.")
    unitAttrs = JSON.parse(unit.attrs)

    if params['data']['mode1'] && params['data']['unit_id1']
      unitAttrs['contentCar1'] = {'mode': params['data']['mode1'], 'unit_id': params['data']['unit_id1']}
    end
    if params['data']['mode2'] && params['data']['unit_id2']
      unitAttrs['contentCar2'] = {'mode': params['data']['mode2'], 'unit_id': params['data']['unit_id2']}
    end
    unit.attrs = unitAttrs.to_json
    unit.save
  } 

  refreshUnitsHash
  content_type :json
  return { status: "ok" }.to_json
end

###################################################################################################
# User configuration section

def getUnitUserConfig(unit)
  getUserPermissions(params[:username], params[:token], unit.id)[:admin] or halt(401)

  # Get permissions for all users of this unit
  query = Sequel::SQL::PlaceholderLiteralString.new(%{
    select eschol_roles.user_id, email, first_name, last_name, role
    from eschol_roles
    join users on users.user_id = eschol_roles.user_id
    where unit_id = :unitID
    order by last_name = '', last_name, first_name, email
  }.unindent, { unitID: unit.id })
  userRoles = {}
  OJS_DB.fetch(query).each { |row|
    userID = row[:user_id]
    userRoles[userID] ||= { user_id: userID, name: formatFirstLast(row), email: row[:email], roles: {} }
    userRoles[userID][:roles][row[:role]] = true
  }

  return { user_roles: userRoles.values }
end

put "/api/unit/:unitID/userConfig" do |unitID|
  getUserPermissions(params[:username], params[:token], unitID)[:super] or restrictedHalt
  OJS_DB.transaction {
    oldRoles = Set.new
    getUnitUserConfig($unitsHash[unitID])[:user_roles].each { |row|
      %w{admin stats submit}.each { |role|
        row[:roles][role] and oldRoles << { userID: row[:user_id], role: role }
      }
    }

    newRoles = Set.new
    params['data'].keys.map{ |k| k.sub(/^\w+-/, '') }.uniq.each { |userID|
      userID == "newuser" or userID = userID.to_i
      %w{admin stats submit}.each { |role|
        params['data']["#{role}-#{userID}"] == 'on' and newRoles << { userID: userID, role: role }
      }
    }

    # Remove specified roles
    (oldRoles - newRoles).each { |pair|
      OJS_DB.run(Sequel::SQL::PlaceholderLiteralString.new(
        "delete from eschol_roles where unit_id = :unitID and user_id = :userID and role = :role",
        { unitID: unitID, userID: pair[:userID], role: pair[:role] }))
    }

    # Add specified roles
    (newRoles - oldRoles).each { |pair|
      userID = pair[:userID]
      if userID == "newuser"
        row = OJS_DB.fetch(Sequel::SQL::PlaceholderLiteralString.new(
          "select user_id from users where lower(email) = :email",
          { email: params['data']['email-newuser'].downcase })).first
        row or jsonHalt(400, "Unknown user")
        userID = row[:user_id]
      end
      OJS_DB.run(Sequel::SQL::PlaceholderLiteralString.new(
        "insert into eschol_roles(unit_id, user_id, role) values (:unitID, :userID, :role)",
        { unitID: unitID, userID: userID, role: pair[:role] }))
    }
  }
  content_type :json
  return { success: true }.to_json
end

###################################################################################################
# Issue configuration section

def getUnitIssueConfig(unit, unitAttrs)
  getUserPermissions(params[:username], params[:token], unit.id)[:admin] or halt(401)
  template = { "numbering" => "both", "rights" => nil, "buy_link" => nil, "show_pub_dates" => "false" }
  issues = Issue.where(unit_id: unit.id).order(Sequel.desc(:published)).order_append(Sequel.desc(Sequel[:issue].cast_numeric)).map { |issue|
    { voliss: "#{issue.volume}.#{issue.issue}" }.merge(template).
      merge(JSON.parse(issue.attrs || "{}").select { |k,_v| template.key?(k) })
  }
  # Fill default issue from db, or most recent issue, else default values
  issues.unshift({ voliss: "default" }.merge(template).merge(
    unitAttrs["default_issue"] ||
    (issues[0] || {}).select { |k,_v| template.key?(k) }))
  return issues
end

def validateRights(rights)
  rights == "none" and return nil
  rights =~ %r{https://creativecommons.org/licenses/(by|by-nc|by-nc-nd|by-nc-sa|by-nd|by-sa)/\d.\d/}
  return rights
end

def validateNumbering(numbering)
  numbering == "both" and return nil
  %w{volume_only issue_only}.include?(numbering) or jsonHalt(400, "Invalid numbering")
  return numbering
end

def validateLink(link)
  link.empty? and return nil
  link =~ %r{^(https?://)|(^/)} or jsonHalt(400, "Invalid link")
  return link
end

def updateIssueConfig(inputAttrs, data, voliss)
  ret = (inputAttrs || {}).merge(
    { "rights" => validateRights(data["rights-#{voliss}"]),
      "numbering" => validateNumbering(data["numbering-#{voliss}"]),
      "buy_link" => validateLink(data["buy_link-#{voliss}"]),
      "show_pub_dates" => data["show_pub_dates-#{voliss}"] }).
    select { |_k,v| !v.nil? }
  return ret.empty? ? nil : ret
end

put "/api/unit/:unitID/issueConfig" do |unitID|
  getUserPermissions(params[:username], params[:token], unitID)[:super] or restrictedHalt
  DB.transaction {
    issueMap = Hash[Issue.where(unit_id: unitID).map { |iss| ["#{iss.volume}.#{iss.issue}", iss] }]
    params['data'].keys.select { |k| k =~ /^rights-/ }.map { |k| k.sub(/^rights-/, '') }.each { |voliss|
      if voliss == "default"
        unit = Unit[unitID] or jsonHalt(404, "Unit not found")
        unitAttrs = JSON.parse(unit.attrs)
        unitAttrs["default_issue"] = updateIssueConfig(unitAttrs["default_issue"], params["data"], voliss)
        unitAttrs["default_issue"] or unitAttrs.delete("default_issue")
        unit.attrs = unitAttrs.to_json
        unit.save
      else
        issue = issueMap[voliss] or jsonHalt(404, "Unknown volume/issue #{voliss.inspect}")
        oldAttrs = issue.attrs ? JSON.parse(issue.attrs) : nil
        newAttrs = updateIssueConfig(JSON.parse(issue.attrs || "{}"), params["data"], voliss)
        if oldAttrs.to_json != newAttrs.to_json
          issue.attrs = newAttrs.to_json
          issue.save
          if oldAttrs&.dig("rights") != newAttrs&.dig("rights")
            Item.where(section: Section.where(issue_id: issue.id).select(:id)).update(rights: newAttrs&.dig("rights"))
          end
        end
      end
    }
  }
  content_type :json
  return { success: true }.to_json
end

def formatFirstLast(row)
  return [row[:last_name]=="" ? nil : row[:last_name],
          row[:first_name]=="" ? nil : row[:first_name]].compact.join(", ")
end

def getAuthorSearchData
  getUserPermissions(params[:username], params[:token], 'root')[:super] or halt(401)
  str = params['q']
  str && str.length > 1 or return { authors: [] }

  # Query for all variations of email or name that contain the partial string
  personMap = Hash.new { |h,k| h[k] = Set.new }
  query = Sequel::SQL::PlaceholderLiteralString.new(%{
    select distinct
      person_id,
      JSON_UNQUOTE(item_authors.attrs->"$.name") name,
      JSON_UNQUOTE(item_authors.attrs->"$.email") auth_email,
      JSON_UNQUOTE(people.attrs->"$.email") person_email
    from item_authors
    inner join people on people.id = item_authors.person_id
    where lower(concat(item_authors.attrs->"$.email", item_authors.attrs->"$.name", people.attrs->"$.email")) like :matchStr
    order by item_authors.attrs->"$.name"
    limit 200
  }.unindent, { matchStr: "%#{str.downcase}%" })
  DB.fetch(query).each { |row|
    personMap[row[:person_id]] << [row[:auth_email], row[:person_email], row[:name]]
  }

  # Sum them all up into unique sets by person ID
  authors = personMap.sort.map { |personID, variations|
    emails = Set.new
    names = Set.new
    variations.each { |authEmail, personEmail, name|
      emails << authEmail << personEmail
      names << name
    }
    { person_id: personID.sub(%r{^ark:/99166/},''), emails: emails.to_a.sort, names: names.to_a.sort }
  }

  # Let's do similar stuff for user accounts
  query = Sequel::SQL::PlaceholderLiteralString.new(%{
    select users.user_id, email, first_name, last_name,
           group_concat(distinct journals.path) as journals,
           group_concat(distinct eschol_roles.unit_id) as units
    from users
    left join roles on users.user_id = roles.user_id
    left join journals on journals.journal_id = roles.journal_id
    left join eschol_roles on users.user_id = eschol_roles.user_id
    where lower(concat(email, first_name, last_name)) like :matchStr
    group by users.user_id
    order by last_name = '', last_name, first_name, email
    limit 200
  }.unindent, { matchStr: "%#{str.downcase}%" })
  accounts = OJS_DB.fetch(query).map { |row|
    { user_id: row[:user_id],
      email: row[:email],
      name: formatFirstLast(row),
      units: (Set.new(row[:journals] ? row[:journals].split(",") : []) +
              Set.new(row[:units] ? row[:units].split(",") : [])).to_a.sort[0,6]  # limit 5, plus marker of more
    }
  }

  # Also query for forwarded addresses (and point to the target user)
  query = Sequel::SQL::PlaceholderLiteralString.new(%{
    select users.user_id, eschol_prev_email.email as prev_email, users.email as cur_email
    from eschol_prev_email
    join users on users.user_id = eschol_prev_email.user_id
    where lower(eschol_prev_email.email) like :matchStr
  }.unindent, { matchStr: "%#{str.downcase}%" })
  forwards = {}
  OJS_DB.fetch(query).each { |row|
    forwards.key?(row[:cur_email]) or forwards[row[:cur_email]] =
      { user_id: row[:user_id], cur_email: row[:cur_email], prev_emails: [] }
    forwards[row[:cur_email]][:prev_emails] << row[:prev_email]
  }

  return { search_str: str, authors: authors, accounts: accounts, forwards: forwards.values }
end
