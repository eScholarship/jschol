Sequel.migration do
  up do
    create_table(:archive_meta) do
      foreign_key :item_id, :items, type: String, null: false
      String      :meta, type: 'MEDIUMTEXT'
      String      :feed, type: 'MEDIUMTEXT'
      String      :cookie, type: 'MEDIUMTEXT'
      String      :history, type: 'MEDIUMTEXT'
    end
    run("ALTER TABLE archive_meta ROW_FORMAT=COMPRESSED")
  end
  down do
    drop_table(:archive_meta)
  end
end
