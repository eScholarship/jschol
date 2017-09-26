Sequel.migration do
  up do
    alter_table(:display_pdfs) do
      drop_column :linear_patch_size
      drop_column :splash_patch_size
    end
  end

  down do
    raise "Can't go back"
  end
end
