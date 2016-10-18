
class BreadcrumbGenerator

  def initialize(thisPageName, type)
    @thisPageName = thisPageName
    @type = type
    @unitID = (type == "unit") ? thisPageName : getItemsUnit(thisPageName) 
  end

  # ---Public Method---
  # Given a unit ID, return an array containing topmost item under root (ID and name), 
  # or empty array if root, or if empty parent due to withdrawn item
  def getCampusInfo
    unitID = @unitID
    if ['root', nil].include? unitID
      return [nil, nil] 
    else
      until isCampus?(unitID) 
        unitID = getParent(unitID)
      end        
    end
    unit = Unit[unitID]
    return [unitID, unit.name]
  end

  # ---Public Method---
  # Generate breadcrumb object as an array of hashes containing name/url key-values 
  # by working our way up the unit tree
  def generateCrumb
    if @unitID == nil   #Empty parent
      return [] 
    end

    nodes = []

    if @type == "item"  # Display volume/issue only for journal articles
      volume,issue = getVolumeIssue(@thisPageName) 
      if volume && issue
        nodes.unshift({"name" => "Volume " + volume + ", Issue " + issue, "url" => "/item/#{@thisPageName}"})
      end
    end

    unitID = @unitID
    until unitID == "root"
      unit = Unit[unitID]
      nodes.unshift({"name" => unit.name, "url" => "/unit/#{unitID}"})
      # ToDo: Handle mutiple campuses
      unitID = getParent(unitID)
    end
    nodes.unshift({"name" => "eScholarship", "url" => "/"})
    return nodes
  end

  # Get parent unit ID, given a unit ID
  def getParent(unitID)
    return UnitHier.filter(:unit_id => unitID, :is_direct => true).order(:ordering).map(:ancestor_unit)[0]
  end

  # Get parent unit ID, given an item ID
  def getItemsUnit(pageName)
    itemID = 'qt' + pageName
    unitID = UnitItem.filter(:item_id => itemID, :is_direct => true).order(:ordering_of_units).map(:unit_id)[0]
    return unitID
  end

  # Check if this is topmost unit under root.  
  # Technically topmost unit can be a campus -or- an ORU (i.e. 'lbnl')
  def isCampus?(unitID)
    parents = UnitHier.filter(:unit_id => unitID, :is_direct => true).map { |hier| hier.ancestor_unit }
    r = parents ? parents[0] == 'root' : false
    return r
  end

  # Get volume and issue given an item ID. If item is not a journal, returns empty array 
  def getVolumeIssue(pageName)
    itemID = 'qt' + pageName
    issue_id = Item.join(:sections, :id => :section).filter(:items__id => itemID).map(:issue_id)[0]
    return Section.join(:issues, :id => issue_id).map([:volume, :issue])[0]
  end

  private :getParent, :getItemsUnit, :isCampus?, :getVolumeIssue

end
