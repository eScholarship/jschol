# Item 'contributors' are generally less central to the creation than 'authors';
# the 'role' is usually 'editor' or 'advisor' but we can expand in future to new roles.
Sequel.migration do
  change do
    create_table(:item_contribs) do
      foreign_key :item_id, :items, :type=>String, :null=>false
      foreign_key :person_id, :people, :type=>String
      String :role, :null=>false
      Integer :ordering, :null=>false
      String :attrs, :type=>'JSON'
      index [:item_id, :role, :ordering], :unique => true
    end
  end
end
