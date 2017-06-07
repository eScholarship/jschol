# We're now storing the order implicitly in the nav_bar JSON of the unit.
# Likewise the name is now in the nav_bar JSON.
# Title is moving into the attrs.
Sequel.migration do
  up do
    alter_table(:pages) do
      drop_column :name
      drop_column :ordering
      drop_column :title
      rename_column :nav_element, :slug
    end
  end

  down do
    raise "Can't go back"
  end
end
