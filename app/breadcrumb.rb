
class BreadcrumbGenerator

  def initialize(thisPageName, type)
    @thisPageName = thisPageName
    @type = type
    @unitID = (type == "unit") ? thisPageName : getItemsUnit(thisPageName) 
  end

  # Returns an array containing topmost item under root ID and name, or empty array if root
  def getCampusInfo
    unitID = @unitID
    if unitID == 'root' 
      return [] 
    else
      until isCampus?(unitID) 
        unitID = UnitHier.filter(:unit_id => unitID, :is_direct => true).order(:ordering).map(:ancestor_unit)[0]
      end        
    end
    unit = Unit[unitID]
    return [unitID, unit.name]
  end

  # Generate an array of hashes containing name/url key-values 
  # If it's unit level, find parent using unit_hier table, otherwise,
  # for item level page look for the parent unit using the unit_item table
  def generateCrumb
    nodes = []

    if @type == "item"
      # ToDo: Journal/Non-journal displays differently
      nodes.unshift({"name" => "Volume/Issue placeholder", "url" => "/item/#{@thisPageName}"})
    end

    unitID = @unitID
    until unitID == "root"
      unit = Unit[unitID]
      nodes.unshift({"name" => unit.name, "url" => "/unit/#{unitID}"})
      # ToDo: Handle mutiple campuses
      unitID = UnitHier.filter(:unit_id => unitID, :is_direct => true).order(:ordering).map(:ancestor_unit)[0]
    end
    nodes.unshift({"name" => "eScholarship", "url" => "/"})
    return nodes
  end

  def getItemsUnit(pageName)
    itemID = 'qt' + pageName
    unitID = UnitItem.filter(:item_id => itemID, :is_direct => true).order(:ordering_of_units).map(:unit_id)[0]
    if !unitID
      pp("No parent Unit for this item ")
      raise "No Unit for this item " + itemID
    else 
      return unitID
    end
  end

  # Is this topmost item under root?  Technically can be campus OR oru (i.e. 'lbnl')
  def isCampus?(unitID)
    parents = UnitHier.filter(:unit_id => unitID, :is_direct => true).map { |hier| hier.ancestor_unit }
    r = parents ? parents[0] == 'root' : false
    return r
  end

  private :getItemsUnit, :isCampus?

end
