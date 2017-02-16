# Fetch data for all the items on the page all at once, to save SQL server round-trips
def readItemData(ids)
  return {
    items: Item.where(:id => ids).to_hash(:id),
    units: UnitItem.where(:item_id => ids, :is_direct => 1).order(:ordering_of_units).to_hash_groups(:item_id),
    authors: ItemAuthors.where(item_id: ids).order(:ordering).to_hash_groups(:item_id)
  }
end

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
        :authors => itemData[:authors][itemID].map { |author| JSON.parse(author.attrs) }
      }

      itemListItem[:supp_files] = [{:type => 'video'}, {:type => 'image'}, {:type => 'pdf'}, {:type => 'audio'}]
      for supp_file_hash in itemListItem[:supp_files]
        if attrs['supp_files']
          supp_file_hash[:count] = attrs['supp_files'].count { |supp_file| supp_file['mimeType'].start_with?(supp_file_hash[:type])}
        else
          supp_file_hash[:count] = 0
        end
      end

      #conditional data included as needed as specified by 'fields' parameter
      itemListItem[:thumbnail] = attrs['thumbnail'] if fields.include? 'thumbnail'
      itemListItem[:pub_date] = item.pub_date if fields.include? 'pub_date'
      itemListItem[:pub_year] = item.pub_date.year if fields.include? 'pub_year'
      itemListItem[:genre] = item.genre if fields.include? 'type_of_work'
      itemListItem[:rights] = item.rights if fields.include? 'rights'
      itemListItem[:peerReviewed] = attrs['is_peer_reviewed'] if fields.include? 'peer_reviewed'

      if fields.include? 'publication_information'
        #if journal, section will be non-nil, follow section link to issue (get volume), follow to unit table
        #item link to the unit should be the same as section link to the unit
        if item.section
          itemIssue = Issue[Section[item.section].issue_id]
          itemUnit = $unitsHash[itemIssue.unit_id]
          itemListItem[:journalInfo] = {displayName: "#{itemUnit.name}, Volume #{itemIssue.volume}, Issue #{itemIssue.issue}", issueId: itemIssue.id, unitId: itemUnit.id}
        #otherwise, use the item link to the unit table for all other content types
        else
          if itemData[:units][itemID]
            unitItem = itemData[:units][itemID][0]  # take first unit only, for now
            unit = $unitsHash[unitItem.unit_id]
            itemListItem[:unitInfo] = {displayName: unit.name, unitId: unit.id}
          end
        end
      end

      searchResults << itemListItem
    else
      puts 'NilClass: '
      puts indexItem['id']
    end
  end
  return searchResults
end
