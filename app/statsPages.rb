# API data for unit and author stats pages

require 'date'
require 'set'
require 'unindent'

$topUnitItems = %{
}

###################################################################################################
def statsData(pageName)
  unitID = params[:unitID]
  case pageName
  when 'summary';              unitStats_summary(unitID)
  when 'history_by_item';      unitStats_historyByItem(unitID)
  when 'history_by_issue';     unitStats_historyByIssue(unitID)
  when 'breakdown_by_item';    unitStats_breakdownByItem(unitID)
  when 'breakdown_by_issue';   unitStats_breakdownByIssue(unitID)
  when 'breakdown_by_month';   unitStats_breakdownByMonth(unitID)
  when 'referrals';            unitStats_referrals(unitID)
  when 'deposits_by_category'; unitStats_depositsByCategory(unitID)
  else raise("unknown stats page #{pageName.inspect}")
  end
end

###################################################################################################
def clamp(minVal, maxVal, n)
  return [minVal, [maxVal, n].min].max
end

###################################################################################################
def incMonth(yrmo)
  (yrmo % 100) == 12 ? yrmo + 100 - 11 : yrmo + 1
end

###################################################################################################
def monthRange(startYm, endYm)
  ym = startYm
  out = [ym]
  while ym < endYm
    ym = incMonth(ym)
    out << ym
  end
  return out.reverse  # show months latest first
end

###################################################################################################
def getStatsParams(unitID, nMonths)
  defaultStart = Date.today << nMonths
  defaultEnd   = Date.today << 1
  startYear  = clamp(1995,      Date.today.year, (params[:st_yr] || defaultStart.year).to_i)
  startMonth = clamp(1,         12,              (params[:st_mo] || defaultStart.month).to_i)
  endYear    = clamp(startYear, Date.today.year, (params[:en_yr] || defaultEnd.year).to_i)
  endMonth   = clamp(1,         12,              (params[:en_mo] || defaultEnd .month).to_i)
  limit      = clamp(1,         500,             (params[:limit] || 50).to_i)
  if startYear == endYear
    endMonth = [startMonth, endMonth].max
  end
  return { unit_name:     $unitsHash[unitID].name,
           year_range:    (1995 .. Date.today.year).to_a,
           st_yr:         startYear,
           st_mo:         startMonth,
           en_yr:         endYear,
           en_mo:         endMonth,
           limit:         limit,
           report_months: monthRange(startYear*100 + startMonth, endYear*100 + endMonth) },
         { unitID:    unitID,
           startYrMo: startYear*100 + startMonth,
           endYrMo:   endYear*100 + endMonth,
           limit:    limit }
end

###################################################################################################
def translateRefDomain(domain)
  domain == "localhost" and return nil # these really shouldn't have gotten in

  # Just grab the last part of the URL
  domain = domain[%r{[^\.]+\.[^\.]+$}] || domain

  # Translate some biggies to plain text
  return domain.sub("google.com", "Google").
                sub("bing.com", "Bing").
                sub("escholarship.org", "eScholarship").
                sub("facebook.com", "Facebook").
                sub("yahoo.com", "Yahoo").
                sub("t.co", "Twitter").
                sub("wikipedia.org", "Wikipedia")
end

###################################################################################################
def translateRefs(refsHash)
  refsHash.nil? and return {}
  counts = Hash.new { |h,k| h[k] = 0 }
  Referrer.where(id: refsHash.keys).each { |ref|
    # Just grab the last part of the URL
    domain = translateRefDomain(ref.domain)
    domain and counts[domain] += refsHash[ref.id.to_s].to_i
  }
  return counts.sort { |a,b| -(a[1] <=> b[1]) }
end

###################################################################################################
def unitStats_summary(unitID)
  # Summary data for the current month is so easy
  startDate = Date.today << 4  # 4 mos ago
  endDate = Date.today << 1  # last month
  startYrmo = startDate.year*100 + startDate.month
  endYrmo = endDate.year*100 + endDate.month
  st = UnitStat.where(unit_id: unitID, month: endDate.year*100 + endDate.month).first
  attrs = st && st.attrs ? JSON.parse(st.attrs) : {}
  return {
    unit_name: $unitsHash[unitID].name,
    unit_type: $unitsHash[unitID].type,
    dateStr: "#{Date::MONTHNAMES[endDate.month]} #{endDate.year}",
    posts: attrs['post'].to_i,
    hits: attrs['hit'].to_i,
    downloads: attrs['dl'].to_i,
    recent_hist: UnitStat.where(unit_id: unitID, month: startYrmo..endYrmo).order(Sequel.desc(:month)).map{ |mst|
      [mst.month, JSON.parse(mst.attrs)['hit'].to_i] },
    referrals: translateRefs(attrs['ref'])[0..4],
    num_categories: CategoryStat.select(:category).distinct.where(unit_id: unitID).count
  }.to_json
end

###################################################################################################
def unitStats_breakdownByMonth(unitID)
  return {
    unit_name: $unitsHash[unitID].name,
    report_data: UnitStat.where(unit_id: unitID).order(Sequel.desc(:month)).map{ |st|
      attrs = JSON.parse(st.attrs)
      [st.month, attrs['post'].to_i, attrs['hit'].to_i, attrs['dl'].to_i] }
  }.to_json
end

###################################################################################################
def unitStats_historyByItem(unitID)
  # Get all the stats and stick them in a big hash
  out, queryParams = getStatsParams(unitID, 4)
  query = Sequel::SQL::PlaceholderLiteralString.new(%{
    select item_stats.attrs->"$.hit" hits, month, id, title, total_hits from item_stats
    inner join items on item_stats.item_id = items.id
    inner join
      (select item_id, sum(attrs->"$.hit") total_hits from item_stats
       where month >= :startYrMo and month <= :endYrMo
       and item_id in (select item_id from unit_items where unit_id = :unitID)
       group by item_id order by sum(attrs->"$.hit") desc limit :limit) th
      on th.item_id = item_stats.item_id
    where month >= :startYrMo and month <= :endYrMo
    order by th.total_hits desc, item_stats.item_id
  }.unindent, queryParams)

  itemData = {}
  DB.fetch(query).each { |row|
    itemID = row[:id]
    itemData[itemID] or itemData[itemID] = { title: sanitizeHTML(row[:title]),
                                             total_hits: row[:total_hits].to_i,
                                             by_month: {} }
    itemData[itemID][:by_month][row[:month]] = row[:hits].to_i
  }

  # Form the final data structure with everything needed to render the form and report
  out[:report_data] = itemData
  return out.to_json
end

###################################################################################################
def unitStats_historyByIssue(unitID)
  # Get all the stats and stick them in a big hash
  out, queryParams = getStatsParams(unitID, 4)
  query = Sequel::SQL::PlaceholderLiteralString.new(%{
    select volume, issue, issues.attrs->"$.numbering", month, sum(item_stats.attrs->"$.hit") hits
    from issues
    inner join sections on sections.issue_id = issues.id
    inner join items on items.section = sections.id
    inner join item_stats on item_stats.item_id = items.id
    where unit_id = :unitID
    and month >= :startYrMo and month <= :endYrMo
    group by volume, issue, month
  }.unindent, queryParams)

  issueData = {}
  DB.fetch(query).each { |row|
    voliss = row[:numbering] == "volume_only" ? row[:volume] :
             row[:numbering] == "issue_only" ? row[:issue] :
             "#{row[:volume]}/#{row[:issue]}"
    issueData[voliss] or issueData[voliss] = { total_hits: 0,
                                               vol_num: row[:volume],
                                               iss_num: row[:issue],
                                               by_month: {} }
    hits = row[:hits].to_i
    issueData[voliss][:total_hits] += hits
    issueData[voliss][:by_month][row[:month]] = hits
  }

  # Sort by descending total. A lot easier to do it here than in the SQL.
  issueData = issueData.sort { |a,b| a[1][:total_hits] <=> b[1][:total_hits] }.reverse

  # Form the final data structure with everything needed to render the form and report
  out[:report_data] = issueData
  return out.to_json
end

###################################################################################################
def unitStats_breakdownByIssue(unitID)
  # Get all the stats and stick them in a big hash
  out, queryParams = getStatsParams(unitID, 4)
  query = Sequel::SQL::PlaceholderLiteralString.new(%{
    select volume, issue, issues.attrs->"$.numbering",
           sum(item_stats.attrs->"$.hit") total_hit, sum(item_stats.attrs->"$.dl") total_dl
    from issues
    inner join sections on sections.issue_id = issues.id
    inner join items on items.section = sections.id
    inner join item_stats on item_stats.item_id = items.id
    where unit_id = :unitID
    and month >= :startYrMo and month <= :endYrMo
    group by volume, issue
    order by sum(item_stats.attrs->"$.hit") desc;
  }.unindent, queryParams)

  issueData = {}
  DB.fetch(query).each { |row|
    voliss = row[:numbering] == "volume_only" ? row[:volume] :
             row[:numbering] == "issue_only" ? row[:issue] :
             "#{row[:volume]}/#{row[:issue]}"
    issueData[voliss] or issueData[voliss] = { vol_num: row[:volume],
                                               iss_num: row[:issue],
                                               total_hits: row[:total_hit],
                                               total_downloads: row[:total_dl] }
  }

  # Form the final data structure with everything needed to render the form and report
  out[:report_data] = issueData.to_a
  return out.to_json
end

###################################################################################################
def unitStats_breakdownByItem(unitID)
  # Get all the stats and stick them in a big hash
  out, queryParams = getStatsParams(unitID, 1)
  query = Sequel::SQL::PlaceholderLiteralString.new(%{
    select id, title, total_hit, total_dl from items
    inner join
      (select item_id, sum(attrs->"$.hit") total_hit, sum(attrs->"$.dl") total_dl
       from item_stats
       where month >= :startYrMo and month <= :endYrMo
       and item_id in (select item_id from unit_items where unit_id = :unitID)
       group by item_id order by sum(attrs->"$.hit") desc limit :limit) th
      on th.item_id = items.id
    order by total_hit desc, id
  }.unindent, queryParams)

  itemData = {}
  DB.fetch(query).each { |row|
    itemData[row[:id]] = { title: sanitizeHTML(row[:title]),
                           total_hits: row[:total_hit].to_i,
                           total_downloads: row[:total_dl].to_i }
  }

  # Form the final data structure with everything needed to render the form and report
  out[:report_data] = itemData
  return out.to_json
end

###################################################################################################
def unitStats_referrals(unitID)
  # Get the raw referral stats and stick them into hashes
  out, queryParams = getStatsParams(unitID, 4)
  totalsByID = Hash.new { |h,k| h[k] = 0 }
  monthsByID = Hash.new { |h,k| h[k] = {} }
  UnitStat.where(unit_id: unitID, month: queryParams[:startYrMo]..queryParams[:endYrMo]).each { |st|
    (JSON.parse(st.attrs)['ref'] || {}).each { |refID, ct|
      refID != "other" and totalsByID[refID] += ct
      monthsByID[st.month][refID] = ct
    }
  }

  # Translate the IDs to strings (e.g. "Google", or "nih.gov")
  idToStr = Hash[Referrer.where(id: totalsByID.keys).map{ |ref| [ref[:id], translateRefDomain(ref[:domain])] }]
  totalsByStr = Hash.new { |h,k| h[k] = 0 }
  totalsByID.each { |id, count| totalsByStr[idToStr[id.to_i]] += count }

  # Pick the top 25 and sum the final data
  top25 = Hash[totalsByStr.sort { |a,b| -(a[1] <=> b[1]) }[0..24]]
  monthsByStr = Hash.new { |h,k| h[k] = Hash.new { |h2,k2| h2[k2] = 0 } }
  totalOther = 0
  monthsByID.each { |month, refs|
    refs.each { |refID, ct|
      refStr = idToStr[refID.to_i]
      if refID != "other" && top25.key?(refStr)
        monthsByStr[refStr][month] += ct
      else
        monthsByStr["other"][month] += ct
        totalOther += ct
      end
    }
  }
  totalOther > 0 and top25["other"] = totalOther

  # Form the final data structure with everything needed to render the form and report
  out[:report_data] = top25.map { |refStr, total|
    { referrer: refStr,
      total_referrals: total,
      by_month: monthsByStr[refStr] || {}
    }
  }
  return out.to_json
end

###################################################################################################
def unitStats_depositsByCategory(unitID)
  # Splat the raw stats into a hash
  out, queryParams = getStatsParams(unitID, 4)
  overall = Hash.new { |h,k| h[k] = 0 }
  posts = Hash.new { |h,k| h[k] = Hash.new { |h2,k2| h2[k2] = 0 } }
  CategoryStat.where(unit_id: unitID, month: queryParams[:startYrMo]..queryParams[:endYrMo]).each { |st|
    attrs = JSON.parse(st.attrs)
    nPosts = attrs['post'].to_i
    next if nPosts == 0
    st.category =~ /^postprints:/ and posts['postprints'][st.month] += nPosts
    posts[st.category][st.month] += nPosts
    overall[st.month] += nPosts
  }

  # Form the final data structure with everything needed to render the form and report
  out[:report_data] = [ {
    category: "Overall",
    total_deposits: overall.values.inject{|s,n| s+n},
    by_month: overall
  } ] + posts.sort.map { |cat, byMonth|
    { category: cat,
      total_deposits: byMonth.values.inject{|s,n| s+n},
      by_month: byMonth
    }
  }
  return out.to_json
end