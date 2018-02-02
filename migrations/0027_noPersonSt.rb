Sequel.migration do
  up do
    drop_table :person_stats
  end
  down do
    create_table(:person_stats) do
      foreign_key :person_id, :people, type: String, null: false
      Integer     :month,    null: false
      String      :events,   type: 'JSON', null: false
      index [:month, :person_id], :unique => true
    end
  end
end
