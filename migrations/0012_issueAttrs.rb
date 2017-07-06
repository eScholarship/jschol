# We have more issue info to store, so let's make a JSON attrs since
# that paradigm has been so useful elsewhere.
Sequel.migration do
  up do
    alter_table(:issues) do
      drop_column :cover_page
      add_column :attrs, String, :type=>'JSON'
    end
  end

  down do
    raise "Can't go back"
  end
end
