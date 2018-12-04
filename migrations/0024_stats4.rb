# The stats_months table needs a cur_count column
Sequel.migration do
  change do
    add_column :stats_months, :cur_count, Integer, :null => false
  end
end
