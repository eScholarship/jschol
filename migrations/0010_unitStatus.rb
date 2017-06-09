# Old boolean is_active column changing to 3-state status column
Sequel.migration do
  up do
    alter_table(:units) do
      rename_column :is_active, :status
      set_column_type :status, String
    end
  end

  down do
    alter_table(:units) do
      rename_column :status, :is_active
      set_column_type :is_active, TrueClass
    end
  end
end