# Change all the *_stats indexes to enforce uniqueness.
# Also, add `unit_id` to the category_stats table.
Sequel.migration do
  up do
    alter_table(:unit_stats) do
      drop_index [:month, :unit_id]
      add_index [:month, :unit_id], :unique => true
    end
    alter_table(:item_stats) do
      drop_index [:month, :item_id]
      add_index [:month, :item_id], :unique => true
    end
    alter_table(:person_stats) do
      drop_index [:month, :person_id]
      add_index [:month, :person_id], :unique => true
    end
    alter_table(:category_stats) do
      add_foreign_key :unit_id, :units, type: String, null: false, first: true
      drop_index [:month, :category], :name => "genre_stats_month_stats_genre_index"
      add_index [:unit_id, :category, :month], :unique => true
    end
  end

  down do
    alter_table(:unit_stats) do
      drop_index [:month, :unit_id], :unique => true
      add_index [:month, :unit_id]
    end
    alter_table(:item_stats) do
      drop_index [:month, :item_id], :unique => true
      add_index [:month, :item_id]
    end
    alter_table(:person_stats) do
      drop_index [:month, :person_id], :unique => true
      add_index [:month, :person_id]
    end
    alter_table(:category_stats) do
      drop_foreign_key :unit_id
      drop_index [:unit_id, :category, :month], :unique => true
      add_index [:month, :category], :name => "genre_stats_month_stats_genre_index"
    end
  end
end
