# This grabs higher level units related to an item or unit. Primarily used in the header.

class BreadcrumbGenerator

  def initialize(thisPageName, type)
    @thisPageName = thisPageName
    @type = type
    @itemsParents = (type == "item") ? getItemsParents(thisPageName) : nil
    @unitID = (type == "unit") ? thisPageName : getItemsUnit() 
  end

  # ---Public Method---
  def isJournal?
    return @unitID? Unit.filter(:id => @unitID, :type => 'journal').map(:id)[0] : nil
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
        unitID = getUnitsParent(unitID)
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
      unitID = getUnitsParent(unitID)
    end
    nodes.unshift({"name" => "eScholarship", "url" => "/"})
    return nodes
  end

  # ---Public Method---
  # Array of hashes containing name/url key-values (already initialized by getItemsParents method)
  # Only intended to be called when type=item
  def appearsIn 
    return @itemsParents
  end

  # Generate array of hashes containing key-values for name, unitID, and url
  def getItemsParents(itemPageName)
    itemID = 'qt' + itemPageName
    nodes = []
    unitIDs = UnitItem.filter(:item_id => itemID, :is_direct => true).order(:ordering_of_units).map{ |u| u.unit_id }
    unitIDs.each { |unitID| nodes << {"id" => unitID, "name" => Unit[unitID].name, "url" => "/unit/#{unitID}"} }
    return nodes
  end

  # Get parent unit ID, given a unit ID
  def getUnitsParent(unitID)
    return UnitHier.filter(:unit_id => unitID, :is_direct => true).order(:ordering).map(:ancestor_unit)[0]
  end

  # Get parent unit ID, given an item ID
  # Simply grabs highest order unit.id (leftmost in array) from @itemsParents
  # Only intended to be called when type=item 
  def getItemsUnit()
    return (@itemsParents.size > 0) ? @itemsParents.first['id'] : nil
  end

  # Check if this is topmost unit under root.  
  # Technically topmost unit can be a campus -or- an ORU (i.e. 'lbnl')
  def isCampus?(unitID)
    parents = UnitHier.filter(:unit_id => unitID, :is_direct => true).map { |hier| hier.ancestor_unit }
    r = parents ? parents[0] == 'root' : false
    return r
  end

  # Get volume and issue given an item ID. If item is not a journal, returns empty array 
  # Only intended to be called when type=item
  def getVolumeIssue(itemPageName)
    itemID = 'qt' + itemPageName
    issue_id = Item.join(:sections, :id => :section).filter(:items__id => itemID).map(:issue_id)[0]
    return Section.join(:issues, :id => issue_id).map([:volume, :issue])[0]
  end

  private :getItemsParents, :getUnitsParent, :getItemsUnit, :isCampus?, :getVolumeIssue

end
