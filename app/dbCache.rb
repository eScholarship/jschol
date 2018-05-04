##############################################################################3
# Methods for obtaining database Caches

$lastFillTime = nil
$cacheFillMutex = Mutex.new

def getUnitsHash
  return Unit.to_hash(:id)
end

def refreshUnitsHash
  # Signal for all Puma workers to rebuild their hashes
  signalDbRefill
  $cacheFillMutex.synchronize {
    $unitsHash = getUnitsHash
  }
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
# Used for browse journals page and also included in queries for campus carousel and its stats
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
  return UnitStat.where(unit_id: 'root').sum(Sequel.lit("attrs->'$.post'")).to_i
end

def countViews
  return UnitStat.where(unit_id: 'root').sum(Sequel.lit("attrs->'$.hit'")).to_i
end

def countOpenItems
  return 0 
end

def countEscholJournals
  return Unit.where(type: 'journal', status: 'active').count
end

def countOrus 
  return Unit.where(type: 'oru').exclude(status: 'hidden').count
end

def countGenres
  genreCounts = Item.where(status: 'published').
                     group_and_count(:genre).as_hash(:genre, :count)
  return genreCounts['article'], genreCounts['dissertation'], genreCounts['monograph']
end

############ CAMPUS PAGE statistics ###########

# Get number of views per campus as one hash.
# {"ucb"=>11000, "ucd"=>982 ...}
def getViewsPerCampus
  activeCampusIds = $activeCampuses.map{|id, c| id }
  array = UnitStat.where(:unit_id=>activeCampusIds).
                   select_group(:unit_id).
                   select_append{sum(Sequel.lit("attrs->'$.hit'")).as(count)}.
                   map{ |y| y.values }
  return Hash[array.map(&:values).map(&:flatten)]
end

# Return array of chosen unit ids from contentCarousel config hash (two carousels)
def unitsFromContentCarConfig(attrs)
  car1 = attrs['contentCar1']
  car2 = attrs['contentCar2']
  units = [] 
  for c in [car1, car2]
    if c then units << c['unit_id'] if c['mode'] == 'unit' and c['unit_id'] and c['unit_id'] != "" end
  end
  return units
end

# Unit Carousel: Compile item and view counts for all configured units. Campus may configure up to two (2) units
# {"uclalaw"=> {item_count: 3408, view_count: 30000}, "cpcc"=>...}
def getUnitCarouselStats
  unitsInCars = $activeCampuses.map do |id, c|
    unit = Unit[id]
    attrs = JSON.parse(unit.attrs)
    x = unitsFromContentCarConfig(JSON.parse(unit.attrs))
    next x
  end
  unitsInCars.reject!{ |u| u.empty? }.flatten!.uniq!
  itemsInUnitCar = UnitStat.select_group(:unit_id).where(:unit_id=>unitsInCars).
                            select_append{sum(Sequel.lit("attrs->'$.post'")).as(item_count)}.map{|y| y.values}
  viewsInUnitCar = UnitStat.select_group(:unit_id).where(:unit_id=>unitsInCars).
                            select_append{sum(Sequel.lit("attrs->'$.hit'")).as(view_count)}.map{|y| y.values}
  x = (itemsInUnitCar + viewsInUnitCar).group_by{|h| h[:unit_id]}.map{|k, v| v.reduce(Hash.new, :merge) }
  return x.map{|h| [h[:unit_id], {:item_count=>h[:item_count], :view_count=>h[:view_count]}]}.to_h
end

def sumArrayCounts(array)
  return array.inject(0) {|sum, h| sum + h[:count]}
end

# Journal Carousel: Compile item and view counts for all journals, segmented by campus.
# (Throwing them all in, not bothering to check if campus turned journal carousel on in configuration or not)
# {"ucb"=> {item_count: 3408, view_count: 30000}, "ucla"=>...}
def getJournalCarouselStats
  journalsInCars = $activeCampuses.map do |id, c|
    c_journals = $campusJournals.select{ |j| j[:ancestor_unit].include?(id) }
                  .select{ |h| h[:status]!="archived" }.map{|u| u[:id] }
    item_counts_per_unit = UnitStat.select_group(:unit_id).where(:unit_id=>c_journals).
                                    select_append{sum(Sequel.lit("attrs->'$.post'")).as(count)}.map{|y| y.values}
    item_count = sumArrayCounts(item_counts_per_unit)
    view_counts_per_unit = UnitStat.select_group(:unit_id).where(:unit_id=>c_journals).
                                    select_append{sum(Sequel.lit("attrs->'$.hit'")).as(count)}.map{|y| y.values}
    view_count = sumArrayCounts(view_counts_per_unit)
    {id => {'item_count': item_count, 'view_count': view_count}}
  end
  return journalsInCars.reduce(Hash.new, :merge)
end

############ BROWSE PAGE AND CAMPUS PAGE statistics ###########

# Get number of publications per campus as one hash.
# {"ucb"=>11000, "ucd"=>982 ...}
def getItemStatsPerCampus
  activeCampusIds = $activeCampuses.map{|id, c| id }
  array = UnitStat.where(:unit_id=>activeCampusIds).
                 select_group(:unit_id).
                 select_append{sum(Sequel.lit("attrs->'$.post'")).as(count)}.
                 map{ |y| y.values }
  return Hash[array.map(&:values).map(&:flatten)]
end

# Get number of journals per campus as one hash.
# {"ucb"=>53, "ucd"=>20 ...}
def getJournalStatsPerCampus
  activeJournals = Unit.filter(type: 'journal', status: 'active').map(:id)
  activeCampusIds = $activeCampuses.map{|id, c| id }
  array = UnitHier.join(:units, :id=>:unit_id).
    where(:unit_id=>activeJournals, :ancestor_unit=>activeCampusIds).group_and_count(:ancestor_unit).
    map{|y| y.values}
  return Hash[array.map(&:values).map(&:flatten)]
end

# Get number of ORUs per campus as one hash. ORUs must contain items in unit_items table to be counted
# {"ucb"=>117, "ucd"=>42 ...}
def getOruStatsPerCampus
  orusWithContent = Unit.join(:unit_items, :unit_id=>:id).filter(type: 'oru').exclude(status: 'hidden').
                         distinct.select(:id).map(:id)
  activeCampusIds = $activeCampuses.map{|id, c| id }
  array = UnitHier.join(:units, :id=>:unit_id).
    where(:unit_id=>orusWithContent, :ancestor_unit=>activeCampusIds).group_and_count(:ancestor_unit).
    map{|y| y.values}
  return Hash[array.map(&:values).map(&:flatten)]
end

# Get global static redirect
def getStaticRedirects
  Redirect.where(kind: 'static').as_hash(:from_path, :to_path)
end

def refreshStaticRdirects
  signalDbRefill
  $staticRedirects = getStaticRedirects
end

def signalDbRefill
  # Signal our entire process group that they need to update their cached values.
  Process.kill("WINCH", -Process.getpgrp)
end

def getLastTableUpdateTime
  utime = nil
  DB.fetch("SHOW TABLE STATUS WHERE Name in ('units', 'unit_hier', 'redirects')").each { |row|
    if row[:Update_time] && (!utime || row[:Update_time] > utime)
      utime = row[:Update_time]
    end
  }
  return utime
end

##################################################################################################
# Database caches for speed. We check every 30 seconds for changes. These tables change infrequently.

Thread.new {
  begin
    prevTime = nil
    while true
      utime = getLastTableUpdateTime
      if !utime || utime != prevTime
        prevTime and puts "Unit/hier changed."
        signalDbRefill
        sleep 30  # re-fill at most every 30 sec
      else
        sleep 5   # but check every 5 sec after that
      end
      prevTime = utime
    end
  rescue Exception => e
    puts "Unexpected exception in db watching thread: #{e} #{e.backtrace}"
  end
}

def fillCaches
  $cacheFillMutex.synchronize {
    begin
      utime = getLastTableUpdateTime
      if utime && $lastFillTime == utime  # don't refill if nothing changed
        return
      end
      $lastFillTime = utime
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
      $statsCountArticles, $statsCountThesesDiss, $statsCountBooks = countGenres

      # CAMPUS PAGE statistics
      $statsCampusViews = getViewsPerCampus
      $statsUnitCarousel = getUnitCarouselStats
      $statsJournalCarousel = getJournalCarouselStats

      # BROWSE PAGE AND CAMPUS PAGE statistics
      $statsCampusItems = getItemStatsPerCampus
      $statsCampusJournals = getJournalStatsPerCampus
      $statsCampusOrus = getOruStatsPerCampus

      # OTHER
      $staticRedirects = getStaticRedirects

      puts "...filled             "
    rescue Exception => e
      puts "Unexpected exception during cache filling: #{e} #{e.backtrace}"
    end
  }
end

# Signal from the master process that caches need to be rebuilt.
Signal.trap("WINCH") {
  Thread.new {
    fillCaches
  }
}
