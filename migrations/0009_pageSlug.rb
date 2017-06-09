# We're now storing the order implicitly in the nav_bar JSON of the unit.
# Note that 'name' is duplicated within the nav_bar JSON in unit.
Sequel.migration do
  up do
    alter_table(:pages) do
      drop_column :ordering
      rename_column :nav_element, :slug
    end
  end

  down do
    raise "Can't go back"
  end
end
