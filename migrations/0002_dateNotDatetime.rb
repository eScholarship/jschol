Sequel.migration do
  up do
    set_column_type :issues, :pub_date, Date
    set_column_type :items, :pub_date, Date
    set_column_type :items, :eschol_date, Date
  end

  down do
    set_column_type :issues, :pub_date, DateTime
    set_column_type :items, :pub_date, DateTime
    set_column_type :items, :eschol_date, DateTime
  end
end
