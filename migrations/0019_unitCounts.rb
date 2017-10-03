# Now that we're actually putting data in the unit_counts table, fill in the missing column.
Sequel.migration do
  up do
    alter_table :unit_counts do
      add_column :items_posted, Integer
    end
  end

  down do
    raise "No going back"
  end
end
