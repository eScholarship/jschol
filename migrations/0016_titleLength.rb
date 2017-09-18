Sequel.migration do
  up do
    set_column_type :items, :title, String, size: 1023
  end
  down do
    set_column_type :items, :title, String
  end
end
