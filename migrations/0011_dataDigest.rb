Sequel.migration do
  change do
    add_column :items, :data_digest, String
  end
end
