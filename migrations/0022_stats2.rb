Sequel.migration do
  change do

    # Table to track all the log files that go into the events for a given day
    create_table(:event_logs) do
      Date   :date, null: false
      String :digest, null: false
    end

    # It's easier to have all our JSON columns named the same thing ('attrs')
    rename_column :item_stats, :events, :attrs
    rename_column :person_stats, :events, :attrs
    rename_column :unit_stats, :events, :attrs
    rename_column :genre_stats, :events, :attrs

    # Let's use "category" so we don't have two kinds of "genre" in the database
    rename_table :genre_stats, :category_stats
    rename_column :category_stats, :stats_genre, :category
  end
end
