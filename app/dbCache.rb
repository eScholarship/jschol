##############################################################################3
# Methods for obtaining database Caches

def getUnitsHash
  return Unit.to_hash(:id)
end

def getHierByUnit
  return UnitHier.filter(is_direct: true).to_hash_groups(:unit_id)
end

def getHierByAncestor
  return UnitHier.filter(is_direct: true).to_hash_groups(:ancestor_unit)
end

# Get hash of all active root level campuses/ORUs, sorted by ordering in unit_hier table
def getActiveCampuses
  return Unit.join(:unit_hier, :unit_id=>:id).
           filter(:ancestor_unit=>'root', :is_direct=>1, :is_active=>1).
           order_by(:ordering).to_hash(:id)
end

def getOruAncestors
  return UnitHier.where(is_direct: true).where(ancestor: Unit.where(type: 'oru')).to_hash(:unit_id, :ancestor_unit)
end

# Get number of publications per campus as one hash.
# {"ucb"=>11000, "ucd"=>982 ...}
def getPubsPerCampus
  activeCampusIds = $activeCampuses.map{|id, c| id }
  array = UnitItem.join(:items, :id=>:item_id).
    where(:unit_id=>activeCampusIds).exclude(:status=>'withdrawn').group_and_count(:unit_id).
    map{|y| y.values}
  return Hash[array.map(&:values).map(&:flatten)]
end

# Get number of ORUs per campus as one hash. ORUs must contain items in unit_items table to be counted
# {"ucb"=>117, "ucd"=>42 ...}
def getOrusPerCampus
  orusWithContent = Unit.join(UnitItem, :unit_id=>:id).filter(type: 'oru').distinct.select(:id).map(:id)
  activeCampusIds = $activeCampuses.map{|id, c| id }
  array = UnitHier.join(:units, :id=>:unit_id).
    where(:unit_id=>orusWithContent, :ancestor_unit=>activeCampusIds).group_and_count(:ancestor_unit).
    map{|y| y.values}
  return Hash[array.map(&:values).map(&:flatten)]
end

# Get number of journals per campus as one hash.
# {"ucb"=>53, "ucd"=>20 ...}
def getJournalsPerCampus
  activeJournals = Unit.filter(type: 'journal', is_active: 1).map(:id)
  activeCampusIds = $activeCampuses.map{|id, c| id }
  array = UnitHier.join(:units, :id=>:unit_id).
    where(:unit_id=>activeJournals, :ancestor_unit=>activeCampusIds).group_and_count(:ancestor_unit).
    map{|y| y.values}
  return Hash[array.map(&:values).map(&:flatten)]
end

