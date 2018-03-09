# Once the item `submitted` and `updated` columns have been added and populated,
# we can restrict them to never have null values.
Sequel.migration do
  up do
    alter_table(:items) do
      set_column_not_null :submitted
      set_column_not_null :updated
    end
  end

  down do
    alter_table(:items) do
      set_column_allow_null :submitted
      set_column_allow_null :updated
    end
  end
end
