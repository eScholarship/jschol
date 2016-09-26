# Some items in old eschol have duplicate ordering. There's not an easy way
# to fix that, so we just have to let it be.
Sequel.migration do
  up do
    alter_table(:items) do
      drop_constraint :ordering_in_sect, opts = { type: :unique }
    end
  end

  down do
    alter_table(:items) do
      add_unique_constraint [:ordering_in_sect, :section]
    end
  end
end
