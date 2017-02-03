# Fetch data for all the items on the page all at once, to save SQL server round-trips
def readItemData(ids)
  return {
    items: Item.where(:id => ids).to_hash(:id),
    units: UnitItem.where(:item_id => ids, :is_direct => 1).order(:ordering_of_units).to_hash_groups(:item_id),
    authors: ItemAuthors.where(item_id: ids).order(:ordering).to_hash_groups(:item_id)
  }
end

def itemResultData(itemIds) 
  searchResults = []
  itemData = readItemData(itemIds)
  for itemID in itemIds
    item = itemData[:items][itemID]
    if item
      itemHash = {
        :id => item.id,
        :title => item.title,
        :genre => item.genre,
        :rights => item.rights,
        :content_type => item.content_type,
        :pub_date => item.pub_date,
        :pub_year => item.pub_date.year
      }

      itemAttrs = JSON.parse(item.attrs)
      itemHash[:peerReviewed] = itemAttrs['is_peer_reviewed']
      itemHash[:abstract] = itemAttrs['abstract']

      itemHash[:supp_files] = [{:type => 'video'}, {:type => 'image'}, {:type => 'pdf'}, {:type => 'audio'}]
      for supp_file_hash in itemHash[:supp_files]
        if itemAttrs['supp_files']
          supp_file_hash[:count] = itemAttrs['supp_files'].count { |supp_file| supp_file['mimeType'].start_with?(supp_file_hash[:type])}
        else
          supp_file_hash[:count] = 0
        end
      end

      itemAuthors = itemData[:authors][itemID]
      itemHash[:authors] = itemAuthors.map { |author| JSON.parse(author.attrs) }

      #if journal, section will be non-nil, follow section link to issue (get volume), follow to unit table
      #item link to the unit should be the same as section link to the unit
      if item.section
        itemIssue = Issue[Section[item.section].issue_id]
        itemUnit = $unitsHash[itemIssue.unit_id]
        itemHash[:journalInfo] = {displayName: "#{itemUnit.name}, Volume #{itemIssue.volume}, Issue #{itemIssue.issue}", issueId: itemIssue.id, unitId: itemUnit.id}
      #otherwise, use the item link to the unit table for all other content types
      else
        if itemData[:units][itemID]
          unitItem = itemData[:units][itemID][0]  # take first unit only, for now
          unit = $unitsHash[unitItem.unit_id]
          itemHash[:unitInfo] = {displayName: unit.name, unitId: unit.id}
        end
      end

      searchResults << itemHash
    else
      puts 'NilClass: '
      puts indexItem['id']
    end
  end
  return searchResults
end
