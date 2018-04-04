# It's time to track the OA status of each item.
Sequel.migration do
  up do
    alter_table(:items) do
      add_column :oa_policy, String
    end
  end

  down do
    drop_column :oa_policy
  end
end