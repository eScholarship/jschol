Sequel.migration do
  change do
    add_column :items, :index_digest, String
  end
end
