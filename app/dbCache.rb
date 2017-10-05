##############################################################################3
# Methods for obtaining database Caches

def getUnitsHash
  return Unit.to_hash(:id)
end

def refreshUnitsHash
  $unitsHash = getUnitsHash
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
           filter(:ancestor_unit=>'root', :is_direct=>1).exclude(:status=>["hidden", "archived"]).
           order_by(:ordering).to_hash(:id)
end

def getOruAncestors
  return UnitHier.where(is_direct: true).where(ancestor: Unit.where(type: 'oru')).to_hash(:unit_id, :ancestor_unit)
end

# Get list of journals, their parent campus(es), and active/non-active.
# i.e. {:id=>"ao4elt4",
#       :name=>"Adaptive Optics ...",
#       :ancestor_unit=>["ucla", "ucsc"],
#       :status=>"active"},
def getJournalsPerCampus
  allJournals = Unit.filter(type: 'journal').exclude(status: "hidden").map(:id)
  activeCampusIds = $activeCampuses.map{|id, c| id }
  array = UnitHier.join(:units, :id=>:unit_id).
    where(:unit_id=>allJournals, :ancestor_unit=>activeCampusIds).select(:id, :name, :ancestor_unit, :status).
    map { |h| h.values }
  # Combine journals that have mult. campuses into single hash to allow for easy filtering on Journal Browse page
  array_new = []
  checkedJournal = '' 
  array.each do |h|
    next if h[:id] == checkedJournal 
    campuses = []
    array.select { |x| x[:id] == h[:id] }.each{|y| campuses << y[:ancestor_unit] }
    h[:ancestor_unit] = campuses
    array_new << h
    checkedJournal = h[:id] 
  end
  return array_new
end

######################### STATISTICS ####################################

########### HOME PAGE statistics ############
def countItems
  return Item.where(status: 'published').count
end

def countViews
  return UnitCount.where(unit_id: 'root').sum(:hits)
end

def countOpenItems
  return 0 
end

def countEscholJournals
  return Unit.where(type: 'journal').exclude(status: 'hidden').count
end

def countOrus 
  return Unit.where(type: 'oru').exclude(status: 'hidden').count
end

def countArticles
  return Item.where(genre: 'article').count
end

def countThesesDiss
  return Item.where(genre: 'dissertation').count
end

def countBooks
  return Item.where(genre: 'monograph').count
end

############ CAMPUS PAGE statistics ###########

# Get number of views per campus as one hash.
# {"ucb"=>11000, "ucd"=>982 ...}
def getViewsPerCampus
  activeCampusIds = $activeCampuses.map{|id, c| id }
  array = UnitCount.select_group(:unit_id).where(:unit_id=>activeCampusIds).select_append{sum(:hits).as(count)}.
    map{|y| y.values}
  return Hash[array.map(&:values).map(&:flatten)]
end

############ BROWSE PAGE AND CAMPUS PAGE statistics ###########

# Get number of publications per campus as one hash.
# {"ucb"=>11000, "ucd"=>982 ...}
def getItemStatsPerCampus
  activeCampusIds = $activeCampuses.map{|id, c| id }
  array = UnitItem.join(:items, :id=>:item_id).
    where(:unit_id=>activeCampusIds).exclude(:status=>'withdrawn').group_and_count(:unit_id).
    map{|y| y.values}
  return Hash[array.map(&:values).map(&:flatten)]
end

# Get number of journals per campus as one hash.
# {"ucb"=>53, "ucd"=>20 ...}
def getJournalStatsPerCampus
  activeJournals = Unit.filter(type: 'journal').exclude(status: "hidden").map(:id)
  activeCampusIds = $activeCampuses.map{|id, c| id }
  array = UnitHier.join(:units, :id=>:unit_id).
    where(:unit_id=>activeJournals, :ancestor_unit=>activeCampusIds).group_and_count(:ancestor_unit).
    map{|y| y.values}
  return Hash[array.map(&:values).map(&:flatten)]
end

# Get number of ORUs per campus as one hash. ORUs must contain items in unit_items table to be counted
# {"ucb"=>117, "ucd"=>42 ...}
def getOruStatsPerCampus
  orusWithContent = Unit.join(:unit_items, :unit_id=>:id).filter(type: 'oru').exclude(status: 'hidden').distinct.select(:id).map(:id)
  activeCampusIds = $activeCampuses.map{|id, c| id }
  array = UnitHier.join(:units, :id=>:unit_id).
    where(:unit_id=>orusWithContent, :ancestor_unit=>activeCampusIds).group_and_count(:ancestor_unit).
    map{|y| y.values}
  return Hash[array.map(&:values).map(&:flatten)]
end

##################################################################################################
# Database caches for speed. We check every 30 seconds for changes. These tables change infrequently.

Thread.new {
  begin
    prevTime = nil
    while true
      utime = nil
      DB.fetch("SHOW TABLE STATUS WHERE Name in ('units', 'unit_hier')").each { |row|
        if row[:Update_time] && (!utime || row[:Update_time] > utime)
          utime = row[:Update_time]
        end
      }
      if !utime || utime != prevTime
        prevTime and puts "Unit/hier changed."
        # Signal our entire process group that they need to update their cached values.
        Process.kill("WINCH", -Process.getpgrp)
      end
      prevTime = utime
      sleep 30
    end
  rescue Exception => e
    puts "Unexpected exception in db watching thread: #{e} #{e.backtrace}"
  end
}

def fillCaches
  begin
    puts "Filling caches.           "
    $unitsHash = getUnitsHash
    $hierByUnit = getHierByUnit
    $hierByAncestor = getHierByAncestor
    $activeCampuses = getActiveCampuses
    $oruAncestors = getOruAncestors
    $campusJournals = getJournalsPerCampus    # Used for browse pages

    #####################################################################
    # STATISTICS
    # These are dependent on instantiation of $activeCampuses

    # HOME PAGE statistics
    $statsCountItems =  countItems
    $statsCountViews = countViews
    $statsCountOpenItems = countOpenItems
    $statsCountEscholJournals = countEscholJournals
    $statsCountOrus = countOrus
    $statsCountArticles = countArticles
    $statsCountThesesDiss = countThesesDiss
    $statsCountBooks = countBooks

    # CAMPUS PAGE statistics
    $statsCampusViews = getViewsPerCampus

    # BROWSE PAGE AND CAMPUS PAGE statistics
    $statsCampusItems = getItemStatsPerCampus
    $statsCampusJournals = getJournalStatsPerCampus
    $statsCampusOrus = getOruStatsPerCampus
    puts "...filled             "
  rescue Exception => e
    puts "Unexpected exception during cache filling: #{e} #{e.backtrace}"
  end
end

# Signal from the master process that caches need to be rebuilt.
Signal.trap("WINCH") {
  # Ignore on non-worker process
  if $workerPrefix != ""
    Thread.new { fillCaches }
  end
}

fillCaches
