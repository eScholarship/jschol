Sequel.migration do
  up do
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
