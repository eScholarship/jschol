# Turns out most sections don't have ordering in the old eschol, just null.
# So we have to allow that.
Sequel.migration do
  up do
    alter_table(:sections) do
      set_column_allow_null :ordering
    end
  end

  down do
    alter_table(:sections) do
      set_column_not_null :ordering
    end
  end
end
