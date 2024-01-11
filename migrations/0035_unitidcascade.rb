# The business requirement releated to the schema change is the need 
# to update unit id. Unit id is used in a number of other tables and 
# as a result of the foreign key constraint DB does not allow the unit id
# change. The solution is to update the foreign key constraints to allow
# for updated id to cascade to the other tables. 
# Here is the documentation for the drop and add syntax to update the key 
# constraints. 
#https://github.com/jeremyevans/sequel/blob/master/doc/schema_modification.rdoc#add_foreign_key-
Sequel.migration do
  up do
    # update foreign key constraints to cascade on unit id update
    alter_table :category_stats do
      drop_foreign_key [:unit_id]
      add_foreign_key [:unit_id], :units, on_update: :cascade
    end
    alter_table :issues do
      drop_foreign_key [:unit_id]
      add_foreign_key [:unit_id], :units, on_update: :cascade
    end  
    alter_table :pages do
      drop_foreign_key [:unit_id]
      add_foreign_key [:unit_id], :units, on_update: :cascade
    end    
    alter_table :unit_counts do
      drop_foreign_key [:unit_id]
      add_foreign_key [:unit_id], :units, on_update: :cascade
    end   
    alter_table :unit_hier do
      drop_foreign_key [:unit_id]
      add_foreign_key [:unit_id], :units, on_update: :cascade
      drop_foreign_key [:ancestor_unit]
      add_foreign_key [:ancestor_unit], :units, on_update: :cascade  
    end    
    alter_table :unit_items do
      drop_foreign_key [:unit_id]
      add_foreign_key [:unit_id], :units, on_update: :cascade
    end   
    alter_table :unit_stats do
      drop_foreign_key [:unit_id]
      add_foreign_key [:unit_id], :units, on_update: :cascade
    end 
    alter_table :widgets do
      drop_foreign_key [:unit_id]
      add_foreign_key [:unit_id], :units, on_update: :cascade
    end  
  end
  down do
    raise "No going back"
  end
end
