# Turns out several items have empty content_type, and only supp files.
# So we have to allow that.
Sequel.migration do
  up do
    alter_table(:items) do
      set_column_allow_null :content_type
    end
  end

  down do
    alter_table(:items) do
      set_column_not_null :content_type
    end
  end
end
