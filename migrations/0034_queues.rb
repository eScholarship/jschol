Sequel.migration do
  change do
    create_table(:arks) do
      String :id, primary_key: true, null: false
      String :source, null: false
      String :external_id, null: false
      String :external_url
      index [:source, :external_id], unique: true
    end
    create_table(:queues) do
      foreign_key :item_id, :arks, type: String, null: false, unique: true
      String :queue
      TrueClass :in_progress
      index [:queue, :in_progress]
      index [:in_progress, :item_id]
    end
    create_table(:messages) do
      primary_key :id
      String :task, null: false
      foreign_key :item_id, :arks, key: :id, type: String, null: false
      String :change, null: false
      String :descrip, null: false
    end
    create_table(:index_states) do
      foreign_key :item_id, :arks, key: :id, type: String, null: false
      String :index_name, null: false
      String :state, null: false
      String :descrip, null: false
      int :time
      index [:item_id, :index_name], unique: true
      index [:index_name, :time]
    end
  end
end
