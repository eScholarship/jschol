# We decided to use NULL for items that we have no explicit rights info for
Sequel.migration do
  up do
    alter_table(:items) do
      set_column_allow_null :rights
    end
  end

  down do
    alter_table(:items) do
      set_column_not_null :rights
    end
  end
end
