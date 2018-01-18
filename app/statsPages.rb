# API data for unit and author stats pages

require 'date'
require 'set'
require 'unindent'

$topUnitItems = %{
}

###################################################################################################
def statsData(pageName)
  case pageName
  when 'history_by_item'; unitStats_historyByItem(params[:unitID])
  when 'history_by_issue'; unitStats_historyByIssue(params[:unitID])
  when 'breakdown_by_item'; unitStats_breakdownByItem(params[:unitID])
  when 'breakdown_by_issue'; unitStats_breakdownByIssue(params[:unitID])
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