Sequel.migration do
  change do

    create_table(:info_index) do
      String :unit_id, :null=>false
      String :page_slug
      String :freshdesk_id
      String :index_digest
      unique [:unit_id, :page_slug, :freshdesk_id]
    end

  end
end
