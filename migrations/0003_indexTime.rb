Sequel.migration do
  change do
    add_column :items, :last_indexed, DateTime
  end
end
