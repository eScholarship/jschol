Sequel.migration do
  change do
    alter_table(:items) do
      rename_column :pub_date, :published
      rename_column :eschol_date, :added
      add_column :updated, Date
      add_column :submitted, Date
      add_index [:status, :published, :id]
      add_index [:status, :added, :id]
      add_index [:status, :updated, :id]
      add_index [:status, :submitted, :id]
    end
    alter_table(:issues) do
      rename_column :pub_date, :published
    end
  end
end
