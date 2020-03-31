# API data for unit and author stats pages

require 'date'
require 'set'
require 'unindent'

###################################################################################################
def unitStatsData(unitID, pageName)
  case pageName
  when 'summary';              unitStats_summary(unitID)
  when 'history_by_item';      unitStats_historyByItem(unitID)
  when 'history_by_issue';     unitStats_historyByIssue(unitID)
  when 'breakdown_by_item';    unitStats_breakdownByItem(unitID)
  when 'breakdown_by_issue';   unitStats_breakdownByIssue(unitID)
  when 'breakdown_by_month';   unitStats_breakdownByMonth(unitID)
  when 'breakdown_by_category';unitStats_breakdownByCategory(unitID)
  when 'referrals';            unitStats_referrals(unitID)
  when 'deposits_by_category'; unitStats_depositsByCategory(unitID)
  when 'deposits_by_unit';     unitStats_depositsByUnit(unitID)
  when 'history_by_unit';      unitStats_historyByUnit(unitID)
  when 'breakdown_by_unit';    unitStats_breakdownByUnit(unitID)
  when 'avg_by_unit';          unitStats_avgByUnit(unitID)
  when 'avg_by_category';      unitStats_avgByCategory(unitID)
  when 'deposits_by_oa';       unitStats_depositsByOA(unitID)
  when 'all_users';            unitStats_allUsers(unitID)
  else halt(404, "unknown unit stats page #{pageName.inspect}")
  end
end

###################################################################################################
def authorStatsData(authorID, pageName)
  Person[authorID] or jsonHalt(404, "Author not found")
  case pageName
  when 'summary';              authorStats_summary(authorID)
  when 'history_by_item';      authorStats_historyByItem(authorID)
  when 'breakdown_by_item';    authorStats_breakdownByItem(authorID)
  when 'breakdown_by_month';   authorStats_breakdownByMonth(authorID)
  else halt(404, "unknown author stats page #{pageName.inspect}")
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
def yrmoToStr(yrmo)
  "%d-%02d" % [yrmo/100, yrmo%100]
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
def getStatsRange(minYrmo)
  range = params[:range] || "4mo"
  defaultEnd = Date.today << 1
  defaultStart = Date.today << 4
  minYear = minYrmo / 100
  if range == "custom"
    startYear  = clamp(minYear,   Date.today.year, (params[:st_yr] || defaultStart.year).to_i)
    startMonth = clamp(1,         12,              (params[:st_mo] || defaultStart.month).to_i)
    endYear    = clamp(startYear, Date.today.year, (params[:en_yr] || defaultEnd.year).to_i)
    endMonth   = clamp(1,         12,              (params[:en_mo] || defaultEnd .month).to_i)
    if startYear == endYear
      endMonth = [startMonth, endMonth].max
    end
    if startYear == minYear
      startMonth = [startMonth, minYrmo % 100].max
    end
    if endYear == Date.today.year
      endMonth = [endMonth, Date.today.month].min
    end
  else
    start = range == "all" ? Date.new(minYear, minYrmo%100, 1) :
            range.include?("yr") ? Date.today << (range.to_i*12) :
            Date.today << range.to_i
    startYear  = start.year
    startMonth = start.month
    endYear    = range == "all" ? Date.today.year : defaultEnd.year
    endMonth   = range == "all" ? Date.today.month : defaultEnd.month
  end
  limit      = clamp(1, 500, (params[:limit] || 50).to_i)
  return range, startYear, startMonth, endYear, endMonth, limit
end

###################################################################################################
def humanDateRange(startYear, startMonth, endYear, endMonth)
   return (startYear==endYear && startMonth==endMonth) ?
             "#{Date::MONTHNAMES[startMonth]}, #{startYear}" :
          (startYear==endYear) ?
             "#{Date::MONTHNAMES[startMonth]} through #{Date::MONTHNAMES[endMonth]}, #{startYear}" :
          "#{Date::MONTHNAMES[startMonth]}, #{startYear} through #{Date::MONTHNAMES[endMonth]}, #{endYear}"
end

###################################################################################################
def getUnitStatsParams(unitID, includeNoHitYears = false)
  minYrmo = UnitStat.where(unit_id: unitID).
                     where(Sequel.lit("attrs->'$.#{includeNoHitYears ? 'post' : 'hit'}' is not null")).
                     min(:month)
  minYear = minYrmo / 100
  range, startYear, startMonth, endYear, endMonth, limit = getStatsRange(minYrmo)
  parentUnit = $hierByUnit[unitID] && $hierByUnit[unitID][0].ancestor_unit
  return { unit_name:     $unitsHash[unitID].name,
           parent_id:     parentUnit,
           parent_name:   parentUnit && $unitsHash[parentUnit].name,
           all_years:     (minYear .. Date.today.year).to_a,
           range:         range,
           date_str:      humanDateRange(startYear, startMonth, endYear, endMonth),
           st_yr:         startYear,
           st_mo:         startMonth,
           en_yr:         endYear,
           en_mo:         endMonth,
           limit:         limit,
           report_months: monthRange(startYear*100 + startMonth, endYear*100 + endMonth) },
         { unitID:    unitID,
           startYrMo: startYear*100 + startMonth,
           endYrMo:   endYear*100 + endMonth,
           limit:     limit }
end

###################################################################################################
def getAuthorName(personID)
  # If there are multple last names, there isn't really a "best".
  DB.fetch(Sequel::SQL::PlaceholderLiteralString.new(%{
    select count(distinct attrs->'$.lname') num
    from item_authors
    where person_id = :personID
  }, { personID: personID })).each { |row| # actually there's only one
    row[:num] > 1 and return "[multiple author names]"
  }

  # Otherwise, pick the most recent variant as the "best"
  mostRecent = ItemAuthor.join(:items, id: :item_id).
                          where(person_id: personID).
                          select_append(Sequel.qualify("item_authors", "attrs")).
                          order(Sequel.desc(:added)).first
  attrs = JSON.parse(mostRecent ? mostRecent.attrs : Person[personID].attrs)
  return mostRecent ? attrs['name'] : attrs['email']
end

###################################################################################################
def getAuthorStatsParams(personID, includeNoHitYears = false)
  minYrmo = ItemStat.join(:item_authors, item_id: :item_id).
                     where(person_id: personID).
                     where(Sequel.lit("item_stats.attrs->'$.#{includeNoHitYears ? 'post' : 'hit'}' is not null")).
                     min(:month) || ((Date.today<<1).year*100 + (Date.today<<1).month)
  minYear = minYrmo / 100
  range, startYear, startMonth, endYear, endMonth, limit = getStatsRange(minYrmo)
  return { person_id:     personID,
           author_name:   getAuthorName(personID),
           all_years:     (minYear .. Date.today.year).to_a,
           range:         range,
           date_str:      humanDateRange(startYear, startMonth, endYear, endMonth),
           st_yr:         startYear,
           st_mo:         startMonth,
           en_yr:         endYear,
           en_mo:         endMonth,
           limit:         limit,
           report_months: monthRange(startYear*100 + startMonth, endYear*100 + endMonth) },
         { personID:  personID,
           startYrMo: startYear*100 + startMonth,
           endYrMo:   endYear*100 + endMonth,
           limit:     limit }
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
  endDate = Date.today << 1  # last month
  endYrmo = endDate.year*100 + endDate.month
  st = UnitStat.where(unit_id: unitID, month: endYrmo).first
  attrs = st && st.attrs ? JSON.parse(st.attrs) : {}
  parentUnit = $hierByUnit[unitID] && $hierByUnit[unitID][0].ancestor_unit
  return {
    unit_name: $unitsHash[unitID].name,
    unit_type: $unitsHash[unitID].type,
    parent_id: parentUnit,
    parent_name: parentUnit && $unitsHash[parentUnit].name,
    date_str: "#{Date::MONTHNAMES[endDate.month]} #{endDate.year}",
    posts: attrs['post'].to_i,
    hits: attrs['hit'].to_i,
    downloads: attrs['dl'].to_i,
    referrals: translateRefs(attrs['ref'])[0..4],
    num_categories: CategoryStat.select(:category).distinct.where(unit_id: unitID).count,
    has_children: !!$hierByAncestor[unitID]
  }
end

###################################################################################################
def unitStats_breakdownByMonth(unitID)
  out, queryParams = getUnitStatsParams(unitID, true)  # include posting-only early years
  out[:report_data] = UnitStat.where(unit_id: unitID, month: 0..queryParams[:endYrMo]).
                               order(Sequel.desc(:month)).map{ |st|
    attrs = JSON.parse(st.attrs)
    [st.month, attrs['post'] && attrs['post'].to_i, attrs['hit'] && attrs['hit'].to_i, attrs['dl'] && attrs['dl'].to_i] }
  return out
end

###################################################################################################
def unitStats_historyByItem(unitID)
  # Get all the stats and stick them in a big hash
  out, queryParams = getUnitStatsParams(unitID)
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
  return out
end

###################################################################################################
def unitStats_historyByIssue(unitID)
  # Get all the stats and stick them in a big hash
  out, queryParams = getUnitStatsParams(unitID)
  query = Sequel::SQL::PlaceholderLiteralString.new(%{
    select volume, issue, JSON_UNQUOTE(issues.attrs->"$.numbering") numbering,
           month, sum(item_stats.attrs->"$.hit") hits
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
             "#{row[:volume]}(#{row[:issue]})"
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
  return out
end

###################################################################################################
def unitStats_breakdownByIssue(unitID)
  # Get all the stats and stick them in a big hash
  out, queryParams = getUnitStatsParams(unitID)
  query = Sequel::SQL::PlaceholderLiteralString.new(%{
    select volume, issue, JSON_UNQUOTE(issues.attrs->"$.numbering") numbering,
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
             "#{row[:volume]}(#{row[:issue]})"
    issueData[voliss] or issueData[voliss] = { vol_num: row[:volume],
                                               iss_num: row[:issue],
                                               total_hits: row[:total_hit],
                                               total_downloads: row[:total_dl] }
  }

  # Form the final data structure with everything needed to render the form and report
  out[:report_data] = issueData.to_a
  return out
end

###################################################################################################
def unitStats_breakdownByItem(unitID)
  # Get all the stats and stick them in a big hash
  out, queryParams = getUnitStatsParams(unitID)
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
  return out
end

###################################################################################################
def unitStats_referrals(unitID)
  # Get the raw referral stats and stick them into hashes
  out, queryParams = getUnitStatsParams(unitID)
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
  return out
end

###################################################################################################
def unitStats_depositsByCategory(unitID)
  # Splat the raw stats into a hash
  out, queryParams = getUnitStatsParams(unitID, true) # true to include really old years
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
    category: "overall",
    total_deposits: overall.values.inject{|s,n| s+n},
    by_month: overall
  } ] + posts.sort.map { |cat, byMonth|
    { category: cat,
      total_deposits: byMonth.values.inject{|s,n| s+n},
      by_month: byMonth
    }
  }
  return out
end

###################################################################################################
def unitStats_avgByCategory(unitID)
  # Splat the raw stats into a hash
  out, queryParams = getUnitStatsParams(unitID) # don't include really old years with no hits
  data = Hash.new { |h,k| h[k] = Hash.new { |h2,k2| h2[k2] = 0 } }
  posts = Hash.new { |h,k| h[k] = Hash.new { |h2,k2| h2[k2] = 0 } }
  CategoryStat.where(unit_id: unitID, month: 0..queryParams[:endYrMo]).each { |st|
    attrs = JSON.parse(st.attrs)

    # Attribute each post event to its first month and every month thereafter
    nPosts = attrs['post'].to_i
    if nPosts > 0
      mo = st.month
      while mo <= queryParams[:endYrMo]
        posts[st.category][mo] += nPosts
        posts['overall'][mo] += nPosts
        st.category =~ /^postprints:/ and posts['postprints'][mo] += nPosts
        mo = incMonth(mo)
      end
    end

    # Record hits (as opposed to posts) only for selected months
    hits = attrs['hit'].to_i
    if hits > 0 && st.month >= queryParams[:startYrMo]
      data[st.category][st.month] += hits
      data['overall'][st.month] += hits
      st.category =~ /^postprints:/ and data['postprints'][st.month] += hits
    end
  }

  avgByCat = Hash[posts.map { |cat, byMonth|
    sum = 0
    n = 0
    byMonth.each { |mo, nPosts|
      if mo >= queryParams[:startYrMo]
        sum += data[cat][mo].to_f / nPosts
        n += 1
      end
    }
    [cat, n > 0 ? sum.to_f / n : nil]
  }]

  # Form the final data structure with everything needed to render the form and report
  data = data.sort { |a,b| a[0] == "overall" ? -1 : b[0] == "overall" ? 1 : a[0] <=> b[0] }
  out[:report_data] = data.map { |cat, byMonth|
    { category: cat,
      total_avg: avgByCat[cat] ? sprintf("%.2f", avgByCat[cat]) : nil,
      by_month: Hash[byMonth.map{ |mo, hits|
        [mo, posts[cat][mo] ? sprintf("%.2f", hits.to_f / posts[cat][mo]) : nil] }]
    }
  }
  return out
end

###################################################################################################
def unitStats_breakdownByCategory(unitID)
  # Splat the raw stats into a hash
  out, queryParams = getUnitStatsParams(unitID, true)  # include posting-only early years
  data = Hash.new { |h,k| h[k] = Hash.new { |h2,k2| h2[k2] = 0 } }
  CategoryStat.where(unit_id: unitID, month: queryParams[:startYrMo]..queryParams[:endYrMo]).each { |st|
    attrs = JSON.parse(st.attrs)
    hits = attrs['hit'].to_i
    downloads = attrs['dl'].to_i
    deposits = attrs['post'].to_i
    data[st.category][:deposits]  += deposits
    data[st.category][:hits]      += hits
    data[st.category][:downloads] += downloads
    data['overall'][:deposits]  += deposits
    data['overall'][:hits]      += hits
    data['overall'][:downloads] += downloads
    if st.category =~ /^postprints:/
      data['postprints'][:deposits]  += deposits
      data['postprints'][:hits]      += hits
      data['postprints'][:downloads] += downloads
    end
  }

  # Form the final data structure with everything needed to render the form and report
  data = data.sort { |a,b| a[0] == "overall" ? -1 : b[0] == "overall" ? 1 : a[0] <=> b[0] }
  out[:report_data] = data.map { |cat, rd|
    { category: cat,
      total_deposits: rd[:deposits]>0 && rd[:deposits],
      total_requests: rd[:hits]>0 && rd[:hits],
      total_downloads: rd[:downloads]>0 && rd[:downloads]
    }
  }
  return out
end

###################################################################################################
def getChildTypes(unitID)
  $hierByAncestor[unitID] or return nil
  types = Hash.new { |h,k| h[k] = 0 }
  $hierByAncestor[unitID].each { |uh| types[$unitsHash[uh.unit_id].type] += 1 }
  return types
end

###################################################################################################
def unitStats_depositsByUnit(unitID)
  # Splat the raw stats into a hash
  out, queryParams = getUnitStatsParams(unitID, true) # true to include really old years
  childUnitIDs = ($hierByAncestor[unitID] || []).map{|u| u.unit_id}
  overall = Hash.new { |h,k| h[k] = 0 }
  posts = Hash.new { |h,k| h[k] = Hash.new { |h2,k2| h2[k2] = 0 } }
  childrenFound = Set.new
  UnitStat.where(unit_id: [unitID]+childUnitIDs, month: queryParams[:startYrMo]..queryParams[:endYrMo]).each { |st|
    attrs = JSON.parse(st.attrs)
    nPosts = attrs['post'].to_i
    next if nPosts == 0
    if st.unit_id == unitID
      overall[st.month] += nPosts
    else
      childrenFound << st.unit_id
      posts[st.unit_id][st.month] += nPosts
    end
  }
  totalByUnit = Hash[posts.map { |unitID, byMonth| [unitID, byMonth.values.inject{|s,n| s+n}] }]

  # Make sure even units with no data are represented.
  childUnitIDs.each { |id| posts[id] ||= {} }

  # Form the final data structure with everything needed to render the form and report
  out[:any_drill_down] = childUnitIDs.any? { |childID| !!$hierByAncestor[childID] }
  posts = posts.sort { |a,b|
    n = -((totalByUnit[a[0]]||0) <=> (totalByUnit[b[0]]||0))
    n != 0 ? n : $unitsHash[a[0]].name <=> $unitsHash[b[0]].name
  }
  out[:report_data] = [ {
    unit_name: "Overall",
    total_deposits: overall.values.inject{|s,n| s+n},
    by_month: overall
  } ] + posts.map { |unitID, byMonth|
    { unit_id: unitID,
      unit_name: $unitsHash[unitID].name,
      child_types: getChildTypes(unitID),
      total_deposits: totalByUnit[unitID],
      by_month: byMonth
    }
  }
  return out
end

###################################################################################################
def unitStats_historyByUnit(unitID)
  # Splat the raw stats into a hash
  out, queryParams = getUnitStatsParams(unitID)
  childUnitIDs = ($hierByAncestor[unitID] || []).map{|u| u.unit_id}
  overall = Hash.new { |h,k| h[k] = 0 }
  data = Hash.new { |h,k| h[k] = Hash.new { |h2,k2| h2[k2] = 0 } }
  UnitStat.where(unit_id: [unitID]+childUnitIDs, month: queryParams[:startYrMo]..queryParams[:endYrMo]).each { |st|
    attrs = JSON.parse(st.attrs)
    hits = attrs['hit'].to_i
    next if hits == 0
    if st.unit_id == unitID
      overall[st.month] += hits
    else
      data[st.unit_id][st.month] += hits
    end
  }
  totalByUnit = Hash[data.map { |unitID, byMonth| [unitID, byMonth.values.inject{|s,n| s+n}] }]

  # Make sure even units with no data are represented.
  childUnitIDs.each { |id| data[id] ||= {} }

  # Form the final data structure with everything needed to render the form and report
  out[:any_drill_down] = childUnitIDs.any? { |childID| !!$hierByAncestor[childID] }
  data = data.sort { |a,b|
    n = -((totalByUnit[a[0]]||0) <=> (totalByUnit[b[0]]||0))
    n != 0 ? n : $unitsHash[a[0]].name <=> $unitsHash[b[0]].name
  }
  out[:report_data] = [ {
    unit_name: "Overall",
    total_requests: overall.values.inject{|s,n| s+n},
    by_month: overall
  } ] + data.map { |unitID, byMonth|
    { unit_id: unitID,
      unit_name: $unitsHash[unitID].name,
      child_types: getChildTypes(unitID),
      total_requests: totalByUnit[unitID],
      by_month: byMonth
    }
  }
  return out
end

###################################################################################################
def unitStats_avgByUnit(unitID)
  # Splat the raw stats into a hash
  out, queryParams = getUnitStatsParams(unitID)
  childUnitIDs = ($hierByAncestor[unitID] || []).map{|u| u.unit_id}
  overall = Hash.new { |h,k| h[k] = 0 }
  data = Hash.new { |h,k| h[k] = Hash.new { |h2,k2| h2[k2] = 0 } }
  posts = Hash.new { |h,k| h[k] = Hash.new { |h2,k2| h2[k2] = 0 } }
  UnitStat.where(unit_id: [unitID]+childUnitIDs, month: 0..queryParams[:endYrMo]).each { |st|
    attrs = JSON.parse(st.attrs)

    # Attribute post to its first month and every month thereafter
    nPosts = attrs['post'].to_i
    if nPosts > 0
      mo = st.month
      while mo <= queryParams[:endYrMo]
        posts[st.unit_id][mo] += nPosts
        mo = incMonth(mo)
      end
    end

    # Record hits only for selected months
    hits = attrs['hit'].to_i
    next if hits == 0
    if st.month >= queryParams[:startYrMo]
      data[st.unit_id][st.month] += hits
    end
  }

  avgByUnit = Hash[posts.map { |u, byMonth|
    sum = 0
    n = 0
    byMonth.each { |mo, nPosts|
      if mo >= queryParams[:startYrMo]
        sum += data[u][mo].to_f / nPosts
        n += 1
      end
    }
    [u, n > 0 ? sum.to_f / n : nil]
  }]

  # Make sure even units with no data are represented.
  childUnitIDs.each { |id| data[id] ||= {} }

  # Form the final data structure with everything needed to render the form and report
  out[:any_drill_down] = childUnitIDs.any? { |childID| !!$hierByAncestor[childID] }
  data = data.sort { |a,b|
    n = -((avgByUnit[a[0]]||0) <=> (avgByUnit[b[0]]||0))
    a[0] == unitID ? -1 : b[0] == unitID ? 1 :
      n != 0 ? n : $unitsHash[a[0]].name <=> $unitsHash[b[0]].name
  }
  out[:report_data] = data.map { |u, byMonth|
    { unit_id: u,
      unit_name: u == unitID ? "Overall" : $unitsHash[u].name,
      child_types: u == unitID ? nil : getChildTypes(u),
      total_avg: avgByUnit[u] ? sprintf("%.2f", avgByUnit[u]) : nil,
      by_month: Hash[byMonth.map{ |mo, hits| [mo, posts[u][mo] > 0 ? sprintf("%.2f", hits.to_f / posts[u][mo]) : nil] }]
    }
  }
  return out
end

###################################################################################################
def unitStats_breakdownByUnit(unitID)
  # Splat the raw stats into a hash
  out, queryParams = getUnitStatsParams(unitID, true)  # include posting-only early years
  childUnitIDs = ($hierByAncestor[unitID] || []).map{|u| u.unit_id}
  overall = Hash.new { |h,k| h[k] = 0 }
  data = Hash.new { |h,k| h[k] = Hash.new { |h2,k2| h2[k2] = 0 } }
  UnitStat.where(unit_id: [unitID]+childUnitIDs, month: queryParams[:startYrMo]..queryParams[:endYrMo]).each { |st|
    attrs = JSON.parse(st.attrs)
    hits = attrs['hit'].to_i
    downloads = attrs['dl'].to_i
    deposits = attrs['post'].to_i
    if st.unit_id == unitID
      overall[:deposits]  += deposits
      overall[:hits]      += hits
      overall[:downloads] += downloads
    else
      data[st.unit_id][:deposits]  += deposits
      data[st.unit_id][:hits]      += hits
      data[st.unit_id][:downloads] += downloads
    end
  }

  # Make sure even units with no data are represented.
  childUnitIDs.each { |id| data[id] ||= {} }

  # Form the final data structure with everything needed to render the form and report
  out[:any_drill_down] = childUnitIDs.any? { |childID| !!$hierByAncestor[childID] }
  data = data.sort { |a,b|
    n = -((a[1][:hits]||0) <=> (b[1][:hits]||0))
    n != 0 ? n : $unitsHash[a[0]].name <=> $unitsHash[b[0]].name
  }
  out[:report_data] = [ {
    unit_name: "Overall",
    total_deposits: overall[:deposits],
    total_requests: overall[:hits],
    total_downloads: overall[:downloads]
  } ] + data.map { |unitID, rd|
    { unit_id: unitID,
      unit_name: $unitsHash[unitID].name,
      child_types: getChildTypes(unitID),
      total_deposits: rd[:deposits]>0 && rd[:deposits],
      total_requests: rd[:hits]>0 && rd[:hits],
      total_downloads: rd[:downloads]>0 && rd[:downloads]
    }
  }
  return out
end

###################################################################################################
def unitStats_depositsByOA(unitID)
  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or halt(401)
  unitID == 'root' or halt(404)  # this report only valid at the root level

  # Splat the raw stats into a hash
  out, queryParams = getUnitStatsParams(unitID, true) # true to include really old years
  overall = Hash.new { |h,k| h[k] = 0 }
  posts = Hash.new { |h,k| h[k] = Hash.new { |h2,k2| h2[k2] = 0 } }
  months = Set.new
  CategoryStat.where(unit_id: unitID, month: queryParams[:startYrMo]..queryParams[:endYrMo]).each { |st|
    attrs = JSON.parse(st.attrs)
    nPosts = attrs['post'].to_i
    next if nPosts == 0
    months << st.month
    cat = (st.category == "journals") ? "journals" : "other"
    posts[cat][st.month] += nPosts
    overall[st.month] += nPosts
  }

  # Add in the OA data using a specialized query
  queryParams[:startYrMoStr] = yrmoToStr(queryParams[:startYrMo])
  queryParams[:endYrMoStr]   = yrmoToStr(queryParams[:endYrMo]) + "-31"
  query = Sequel::SQL::PlaceholderLiteralString.new(%{
    select count(*) ct, year(submitted) yr, month(submitted) mo from items
    where status = 'published'
    and oa_policy is not null
    and id in (select item_id from item_stats)
    and submitted >= :startYrMoStr
    and submitted <= :endYrMoStr
    group by year(submitted), month(submitted)
  }.unindent, queryParams)
  DB.fetch(query).each { |row|
    yrmo = row[:yr].to_i*100 + row[:mo].to_i
    posts['OA policy related'][yrmo] += row[:ct]
    posts['other'][yrmo] -= row[:ct]
  }

  # Form the final data structure with everything needed to render the form and report
  out[:report_months] = months.to_a.sort.reverse
  out[:report_data] = [ {
    category: "overall",
    total_deposits: overall.values.inject{|s,n| s+n},
    by_month: overall
  } ] + posts.sort.map { |cat, byMonth|
    { category: cat,
      total_deposits: byMonth.values.inject{|s,n| s+n},
      by_month: byMonth
    }
  }
  return out
end

###################################################################################################
def authorStats_summary(personID)

  # Determine name variations
  nameVariations = Set.new
  authSet = ItemAuthor.join(:items, id: :item_id).
                       where(person_id: personID).
                       select_append(Sequel.qualify("item_authors", "attrs"))
  authSet.each { |auth|
    attrs = JSON.parse(auth[:attrs])
    nameVariations << [attrs['name'], attrs['email']]
  }

  # Sum up the stats
  endDate = Date.today << 1  # last month
  endYrmo = endDate.year*100 + endDate.month
  stats = DB.fetch(Sequel::SQL::PlaceholderLiteralString.new(%{
    select sum(attrs->"$.post") total_posts,
           sum(attrs->"$.hit") total_hits,
           sum(attrs->"$.dl") total_downloads
           from item_stats
    where item_id in (select item_id from item_authors where person_id = :personID)
    and   month = :endYrmo
  }.unindent, { personID: personID, endYrmo: endYrmo })).first
  return {
    person_id:   personID,
    author_name: getAuthorName(personID),
    variations:  nameVariations.to_a.sort,
    date_str:    "#{Date::MONTHNAMES[endDate.month]} #{endDate.year}",
    posts:       stats[:total_posts].to_i,
    hits:        stats[:total_hits].to_i,
    downloads:   stats[:total_downloads].to_i
  }
end

###################################################################################################
def authorStats_historyByItem(personID)
  # Get all the stats and stick them in a big hash
  out, queryParams = getAuthorStatsParams(personID)
  query = Sequel::SQL::PlaceholderLiteralString.new(%{
    select item_stats.attrs->"$.hit" hits, month, id, title, total_hits from item_stats
    inner join items on item_stats.item_id = items.id
    inner join
      (select item_id, sum(attrs->"$.hit") total_hits from item_stats
       where month >= :startYrMo and month <= :endYrMo
       and item_id in (select item_id from item_authors where person_id = :personID)
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
  return out
end

###################################################################################################
def authorStats_breakdownByItem(personID)
  # Get all the stats and stick them in a big hash
  out, queryParams = getAuthorStatsParams(personID)
  query = Sequel::SQL::PlaceholderLiteralString.new(%{
    select id, title, total_hit, total_dl from items
    inner join
      (select item_id, sum(attrs->"$.hit") total_hit, sum(attrs->"$.dl") total_dl
       from item_stats
       where month >= :startYrMo and month <= :endYrMo
       and item_id in (select item_id from item_authors where person_id = :personID)
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
  return out
end

###################################################################################################
def authorStats_breakdownByMonth(personID)
  out, queryParams = getAuthorStatsParams(personID, true)  # include posting-only early years
  query = Sequel::SQL::PlaceholderLiteralString.new(%{
    select month,
           sum(attrs->"$.post") posts,
           sum(attrs->"$.hit") hits,
           sum(attrs->"$.dl") downloads
    from item_stats
    where item_id in (select item_id from item_authors where person_id = :personID)
    group by month
    order by month desc
  }.unindent, queryParams)

  out[:report_data] = DB.fetch(query).map { |row|
    [row[:month], row[:posts], row[:hits], row[:downloads]]
  }

  return out
end

###################################################################################################
def unitStats_allUsers(unitID)
  # Check user permissions
  perms = getUserPermissions(params[:username], params[:token], unitID)
  perms[:admin] or halt(401)
  unitID == 'root' or halt(404)  # this report only valid at the root level

  selectedUnitTypes = %w{campus oru journal}.map { |t| params["type-#{t}"] == "on" ? t : nil }.compact
  params['type-series'] == "on" and selectedUnitTypes += %w{series seminar_series monograph_series}

  ojsRoles = {
    'JournalAdmin':        1,
    'JournalManager':      16,
    'JournalEditor':       256,
    'SectionEditor':       512,
    'LayoutEditor':        768,
    'Reviewer':            4096,
    'CopyEditor':          8192,
    'Proofreader':         12288,
    'JournalAuthor':       65536,
    'Reader':              1048576,
    'SubscriptionManager': 2097152
  }
  selectedOjsRoles = ojsRoles.keys.map { |r| params["role-#{r}"] == "on" ? r : nil }.compact

  escholRoles = {
    'UnitAdmin':     'admin',
    'StatsReceiver': 'stats',
    'Submitter':     'submit'
  }
  selectedEscholRoles = escholRoles.keys.map { |r| params["role-#{r}"] == "on" ? r : nil }.compact

  # Grab valid units, filtering out archived units
  unitNames = {}
  if selectedUnitTypes.empty?
    units = Set.new
  else
    units = Set.new(DB.fetch(Sequel::SQL::PlaceholderLiteralString.new(%{
      select id, type, name
      from units
      where status != 'archived'
      and attrs->>'$.directSubmit' != 'moribund'
      and type in (#{selectedUnitTypes.map { |t| "'#{t}'" }.join(",")})
    }, {})).map { |row| unitNames[row[:id]] = row[:name]; row[:id] })
  end

  # Get all the OJS role associations
  infoByUser = {}
  rows = []
  if !selectedOjsRoles.empty? && !units.empty?
    rows += OJS_DB.fetch(Sequel::SQL::PlaceholderLiteralString.new(%{
      select
        concat(last_name, ', ', first_name) name,
        email,
        group_concat(distinct concat(journals.path, ':', role_id)) roles
      from roles
      join users on users.user_id = roles.user_id
      join journals on journals.journal_id = roles.journal_id
      where role_id in (#{selectedOjsRoles.map{|r| ojsRoles[r]}.join(",")})
      and email != 'help@escholarship.org'
      group by roles.user_id
    }, {})).all
  end

  # Get all the eschol roles
  if !selectedEscholRoles.empty? && !units.empty?
    rows += OJS_DB.fetch(Sequel::SQL::PlaceholderLiteralString.new(%{
      select
        concat(last_name, ', ', first_name) name,
        email,
        group_concat(distinct concat(eschol_roles.unit_id, ':', eschol_roles.role)) roles
      from eschol_roles
      join users on users.user_id = eschol_roles.user_id
      and email != 'help@escholarship.org'
      and role in (#{selectedEscholRoles.map{|r| "'#{escholRoles[r]}'"}.join(",")})
      group by eschol_roles.user_id
    }, {})).all
  end

  allRoles = Set.new
  rows.each { |row|
    info = (infoByUser[row[:email]] ||= { name: row[:name], email: row[:email], roles: {} })
    row[:roles].split(",").each { |pair|
      unit, role = pair.split(":")
      units.include?(unit) or next  # skip obsolete or non-selected units
      role = ojsRoles.key(role.to_i) || escholRoles.key(role) || raise("can't map role: #{role.inspect}")
      allRoles << role
      (info[:roles][role] ||= []) << [unit, unitNames[unit]]
    }
  }

  out = { all_roles: allRoles.to_a,
          date_str: "today",
          report_data: infoByUser.sort{ |a,b| a[1][:name].downcase <=> b[1][:name].downcase }.map { |k, info|
                          info[:roles].empty? ? nil :
                            { name: info[:name].sub(/^, /, ''), email: info[:email], roles: info[:roles] }
                       }.compact,
          selection: params.map { |k, v| k =~ /^(role-|type-)/ ? k : nil }.compact
        }

  # Form the final data structure with everything needed to render the form and report
  return out
end

