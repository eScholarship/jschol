#!/usr/bin/env ruby

# Utility functions used by other stats modules

require 'maxminddb/geolite2/city'

$referrers = {}
$geoIps = {}
$locations = {}
$itemInfoCache = nil

###################################################################################################
def lookupReferrer(ref)
  ref.length > 100 and return nil # Skip ridiculously long (likely spoofed) referrers
  if !$referrers.key?(ref)
    record = Referrer.where(domain: ref).first
    if !record
      Referrer.create(domain: ref)
      record = Referrer.where(domain: ref).first
      record or raise("Failed to insert referrer for domain=#{ref.inspect}")
    end
    $referrers[ref] = record.id
  end
  $referrers[ref]
end

###################################################################################################
def lookupLocation(lat, long, city = nil, country = nil)
  #puts "lookupLocation: lat=#{lat} long=#{long} city=#{city} country=#{country}"
  lat = lat.round(4)
  long = long.round(4)
  if lat < -90 || lat > 90 || long < -180 || long > 180
    #puts "Warning: invalid lat/long #{lat}/#{long}"  # certain old extract have this a lot.
    return nil
  end
  key = "#{lat}:#{long}"
  if !$locations.key?(key)
    record = Location.where(latitude: lat, longitude: long).first
    if !record
      Location.create(latitude: lat, longitude: long)
      record = Location.where(latitude: lat, longitude: long).first
      record or raise("couldn't find just-inserted record for #{lat} #{long}")
    elsif (city && !record.city) || (country && !record.country)
      city and record.city = city
      country and record.country = country
      record.save
    end
    $locations[key] = record.id
  end
  $locations[key]
end

###################################################################################################
def lookupGeoIp(ip)
  if !$geoIps.key?(ip)
    info = MaxMindDB.default_city_db.lookup(ip)
    if !info || !info.location || !info.location.latitude
      #puts "Warning: MaxMindDB failed to lookup ip #{ip}"
      $geoIps[ip] = nil
    else
      $geoIps[ip] = lookupLocation(info.location.latitude,
                                   info.location.longitude,
                                   info.city.name,
                                   info.country.iso_code)
    end
  end
  $geoIps[ip]
end

###################################################################################################
def parseDate(dateStr)
  ret = Date.strptime(dateStr, "%Y-%m-%d")
  ret.year > 1000 && ret.year < 4000 or raise("can't parse date #{dateStr}")
  return ret
end

###################################################################################################
def parseTime(date, timeStr, isGmt)
  timeStr =~ /^(\d\d):(\d\d):(\d\d)$/ or raise("can't parse time #{timeStr}")
  return Time.new(date.year, date.month, date.day,
                  $1.to_i, $2.to_i, $3.to_i,
                  isGmt ? 0 : nil).localtime
end

###################################################################################################
def loadItemInfoCache
  puts "Loading item info cache."
  $itemInfoCache = {}
  Item.select(:id, :attrs).each { |item|
    attrs = JSON.parse(item.attrs)
    data = {}
    attrs['withdrawn_date'] and data[:withdrawn_date] = parseDate(attrs['withdrawn_date'])
    attrs['embargo_date']   and data[:embargo_date]   = parseDate(attrs['embargo_date'])
    $itemInfoCache[item.id] = data
  }
  Redirect.where(kind: "item").each { |redir|
    next unless redir.from_path =~ %r{^/uc/item/(\w{8})$}
    fromArk = "qt#{$1}"
    next unless redir.to_path =~ %r{^/uc/item/(\w{8})$}
    toArk = "qt#{$1}"
    if !$itemInfoCache[fromArk] || !$itemInfoCache[toArk]
      #puts "Warning: invalid redirect from #{fromArk} to #{toArk}"
      next
    end
    $itemInfoCache[fromArk][:redirect] = toArk
  }
end

###################################################################################################
def getItemInfo(ark)
  return $itemInfoCache[ark]
end

###################################################################################################
def getFinalItem(itemID)
  20.times {
    info = getItemInfo(itemID) or return(itemID)
    info[:redirect] or return(itemID)
    itemID = info[:redirect]
  }
  raise("redirect loop involving #{itemID}")
end

###################################################################################################
# We need to auto-migrate stats from redirected items to their targets
def applyItemRedirects
  DB.transaction {
    Redirect.where(kind: "item").each { |redir|
      redir.from_path =~ %r{^/uc/item/(\w{8})$} or raise("can't parse item redirect #{redir.inspect}")
      fromItem = "qt"+$1
      toItem = getFinalItem(fromItem)
      toItem or raise("problem following redirect")
      ItemEvent.where(item_id: fromItem).update(item_id: toItem)
    }
  }
end

