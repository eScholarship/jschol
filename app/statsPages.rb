# API data for unit and author stats pages

require 'date'
require 'set'
require 'unindent'

###################################################################################################
def statsData(pageName)
  case pageName
  when 'history_by_item'; unitStats_historyByItem(params[:unitID])
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
def fillMissingMonths(monthSet)
  firstMonth = monthSet.sort[0]
  lastMonth = monthSet.sort[-1]
  mo = incMonth(firstMonth)
  while mo < lastMonth
    monthSet << mo
    mo = incMonth(mo)
  end
  return monthSet.sort
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
def unitStats_historyByItem(unitID)
  defaultStart = Date.today << 4
  defaultEnd   = Date.today << 1
  startYear  = clamp(1995,      Date.today.year, (params[:st_yr] || defaultStart.year).to_i)
  startMonth = clamp(1,         12,              (params[:st_mo] || defaultStart.month).to_i)
  endYear    = clamp(startYear, Date.today.year, (params[:en_yr] || defaultEnd.year).to_i)
  endMonth   = clamp(1,         12,              (params[:en_mo] || defaultEnd .month).to_i)
  limit      = clamp(1,         500,             (params[:limit] || 50).to_i)
  if startYear == endYear
    endMonth = [startMonth, endMonth].max
  end
  queryParams = { unitID:    unitID,
                  startYrMo: startYear*100 + startMonth,
                  endYrMo:   endYear*100 + endMonth,
                  limit:     limit }

  # Get all the stats and stick them in a big hash
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
  }.unindent, { unitID:    unitID,
                startYrMo: startYear*100 + startMonth,
                endYrMo:   endYear*100 + endMonth,
                limit:     limit })
  itemData = {}
  DB.fetch(query).each { |row|
    itemID = row[:id]
    itemData[itemID] or itemData[itemID] = { title: sanitizeHTML(row[:title]),
                                             total_hits: row[:total_hits].to_i,
                                             by_month: {} }
    itemData[itemID][:by_month][row[:month]] = row[:hits].to_i
  }

  # Form the final data structure with everything needed to render the form and report
  out = { year_range:    (1995 .. Date.today.year).to_a,
          start_year:    startYear,
          start_month:   startMonth,
          end_year:      endYear,
          end_month:     endMonth,
          limit:         limit,
          report_months: monthRange(startYear*100 + startMonth, endYear*100 + endMonth),
          report_data:   itemData }
  #pp out
  return out.to_json
end