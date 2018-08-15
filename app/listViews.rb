# Fetch data for all the items and info results all at once, to save SQL server round-trips
def readItemData(ids)
  return {
    items: Item.where(:id => ids).to_hash(:id),
    units: UnitItem.where(:item_id => ids, :is_direct => 1).order(:ordering_of_units).to_hash_groups(:item_id),
    authors: ItemAuthors.where(item_id: ids).order(:ordering).to_hash_groups(:item_id)
  }
end

# Item Results (Index stored in AWS CloudSearch with 'is_info'=0)
def itemResultData(itemIds, itemData, fields=[])
  searchResults = []

  for itemID in itemIds
    # data needed in every list of items: ['id', 'title', 'authors', 'abstract', 'content_type', 'supp_files']
    item = itemData[:items][itemID]
    if item
      attrs = JSON.parse(item.attrs)
      itemListItem = {
        :id => item.id,
        :title => item.title,
        :abstract => attrs['abstract'],
        :content_type => item.content_type,
        :author_hide => attrs['author_hide'],
      }
      itemListItem[:authors] = itemData[:authors][itemID].map { |author| JSON.parse(author.attrs) } if itemData.dig(:authors, itemID)

      pdfCnt, imageCnt, videoCnt, audioCnt, zipCnt, otherCnt = 0, 0, 0, 0, 0, 0
      if attrs['supp_files']
        for supp_file in attrs['supp_files']
          if supp_file['mimeType']
            subtype = supp_file['mimeType'].split('/')[1]
            if supp_file['mimeType'].include?('pdf')
              pdfCnt += 1
            elsif supp_file['mimeType'].include?('image')
              imageCnt += 1
            elsif supp_file['mimeType'].include?('video')
              videoCnt += 1
            elsif supp_file['mimeType'].include?('audio')
              audioCnt += 1
            elsif ['zip', 'x-bzip', 'x-bzip2', 'x-gtar', 'x-gzip', 'gnutar', 'x-tar', 'x-zip'].include?(subtype)
              zipCnt += 1
            else
              otherCnt += 1
            end
          else
            otherCnt += 1
          end
        end
      end
      itemListItem[:supp_files] = [
        {:type => 'pdf',   :count => pdfCnt},
        {:type => 'image', :count => imageCnt},
        {:type => 'video', :count => videoCnt},
        {:type => 'audio', :count => audioCnt},
        {:type => 'zip',   :count => zipCnt},
        {:type => 'other', :count => otherCnt} ]

      #conditional data included as needed as specified by 'fields' parameter
      itemListItem[:thumbnail] = attrs['thumbnail'] if fields.include? 'thumbnail'
      itemListItem[:published] = item.published if fields.include? 'published'
      itemListItem[:pub_year] = item.published.year if fields.include? 'pub_year'
      itemListItem[:genre] = item.genre if fields.include? 'type_of_work'
      itemListItem[:rights] = item.rights if fields.include? 'rights'
      itemListItem[:peerReviewed] = attrs['is_peer_reviewed'] if fields.include? 'peer_reviewed'

      if fields.include? 'publication_information'
        #if journal, section will be non-nil, follow section link to issue (get volume), follow to unit table
        #item link to the unit should be the same as section link to the unit
        if item.section
          itemIssue = Issue[Section[item.section].issue_id]
          itemUnit = $unitsHash[itemIssue.unit_id]
          itemListItem[:journalInfo] = {displayName: "#{itemUnit.name}, Volume #{itemIssue.volume}, Issue #{itemIssue.issue}", issueId: itemIssue.id, link_path: itemUnit.id + "/" + itemIssue.volume + "/" + itemIssue.issue}
        #otherwise, use the item link to the unit table for all other content types
        else
          if itemData[:units][itemID]
            unitItem = itemData[:units][itemID][0]  # take first unit only, for now
            unit = $unitsHash[unitItem.unit_id]
            itemListItem[:unitInfo] = {displayName: unit.name, link_path: unit.id}
          end
        end
      end

      searchResults << itemListItem
    else
      puts 'NilClass: '
      puts itemID
    end
  end
  return searchResults
end

def infoPageSyntaxError(infoID)
  puts "Unrecognized info page ID: #{infoID}"
end

def getTopmostId(unit)
  return isTopmostUnit(unit) ? nil : getCampusId(unit)
end

# Info Results (Index stored in AWS CloudSearch with 'is_info'=1)
# Info IDs look like this:
#   i.e. "unit:ucbclassics_rw"
#   i.e. "page:ucbclassics_rw:policyStatement"
def infoResultData(infoIds)
  searchResults = []

  for infoID in infoIds
    # Grab text from either a page or a unit
    infoListInfo={}
    nodes = infoID.split(":")
    if nodes.length < 2   
      infoPageSyntaxError(infoID)
      next
    end

    unit_id = nodes[1]
    unit = $unitsHash[unit_id]
    next if unit.nil?  # filter out info pages in search index from deleted unit

    case nodes[0]
    when "unit"
      ancestor = getUnitAncestor(unit)
      ancestor_name, ancestor_id = ancestor ? [ancestor.name, ancestor.id] : nil
      # if ancestor_id is campus or root, don't bring in topmost
      topmost_id = getTopmostId($unitsHash[ancestor_id])
      unitAttrs = JSON.parse(unit.attrs)
      infoListInfo = {
        id: infoID,
        ancestor_id: ancestor_id, 
        ancestor_name: ancestor_name,
        target_id: unit_id,
        target_name: unit.name,
        isPage: false,
        content: unitAttrs['about']
      }
    when "page"
      if nodes.length < 3   
        infoPageSyntaxError(infoID)
        next
      end
      # if unit_id/ancestor_id is campus or root, don't bring in topmost
      topmost_id = getTopmostId(unit)
      page = Page.where(unit_id: unit_id, slug: nodes[2]).first
      page and infoListInfo = {
        id: infoID,
        ancestor_id: unit_id,
        ancestor_name: unit.name,
        target_id: nodes[2],
        target_name: page.name,
        isPage: true,
        content: nil
      }
    else
      infoPageSyntaxError(infoID)
      next
    end
    infoListInfo[:topmost_name] = topmost_id ? $unitsHash[topmost_id].name : nil

    searchResults << infoListInfo
  end
  return searchResults
end

