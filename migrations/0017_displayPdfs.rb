Sequel.migration do
  change do

    create_table(:display_pdfs) do
      String    :item_id, :primary_key=>true
      int       :orig_size, :null=>false
      DateTime  :orig_timestamp, :null=>false
      int       :linear_size
      int       :linear_patch_size
      String    :splash_info_digest
      int       :splash_size
      int       :splash_patch_size
    end

  end
end
