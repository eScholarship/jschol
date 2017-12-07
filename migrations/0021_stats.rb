Sequel.migration do
  change do

    create_table(:referrers) do
      Integer    :id, primary_key: true
      String     :domain, null: false
    end

    create_table(:locations) do
      Integer    :id, primary_key: true
      Float      :latitude, null: false
      Float      :longitude, null: false
      String     :city
      String     :country
    end

    create_table(:item_events) do
      foreign_key :item_id,  :items, type: String, size: 10, fixed: true, null: false
      Date        :date,     null: false
      Time        :time,     only_time: true
      foreign_key :location, :locations, type: Integer
      foreign_key :referrer, :referrers, type: Integer
      String      :attrs,    type: 'JSON'
      index [:date, :item_id]
    end

    create_table(:item_stats) do
      foreign_key :item_id,  :items, type: String, size: 10, fixed: true, null: false
      Integer     :month,    null: false
      String      :events,   type: 'JSON', null: false
      TrueClass   :is_dirty, null: false
      index [:month, :item_id]
    end

    create_table(:item_hier_cache) do
      foreign_key :item_id,  :items, type: String, size: 10, fixed: true, null: false
      String      :old_hier
      String      :cur_hier, null: false
    end

    create_table(:person_stats) do
      foreign_key :person_id, :people, type: String, null: false
      Integer     :month,    null: false
      String      :events,   type: 'JSON', null: false
      index [:month, :person_id]
    end

    create_table(:unit_stats) do
      foreign_key :unit_id, :units, type: String, null: false
      Integer     :month,    null: false
      String      :events,   type: 'JSON', null: false
      index [:month, :unit_id]
    end
  end
end
