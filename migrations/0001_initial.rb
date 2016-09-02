Sequel.migration do
  change do

    create_table(:units) do
      String    :id, :primary_key=>true
      String    :name, :null=>false
      String    :type, :null=>false
      TrueClass :is_active
      String    :attrs, :type=>'JSON'
    end
    
    create_table(:unit_hier) do
      foreign_key :unit_id, :units, :type=>String, :null=>false
      foreign_key :ancestor_unit, :units, :type=>String, :null=>false
      Integer   :ordering  # non-null for direct, null for indirect
      TrueClass :is_direct
      unique [:ancestor_unit, :unit_id]
      unique [:ordering, :ancestor_unit]
    end

    create_table(:pages) do
      primary_key :id
      foreign_key :unit_id, :units, :type=>String, :null=>false
      foreign_key :parent_page, :pages, :type=>Integer
      String :name, :null=>false
      String :title, :null=>false
      DateTime :date, :null=>false
      String :html, :null=>false
    end

    create_table(:static_queries) do
      foreign_key :page_id, :pages, :type=>Integer, :null=>false
      String :query_string, :null=>false
    end

    create_table(:widgets) do
      primary_key :id
      foreign_key :unit_id, :units, :type=>String, :null=>false
      String :kind, :null=>false
      Integer :ordering, :null=>false
      String :attrs, :type=>'JSON'
      unique [:ordering, :unit_id]
    end

    create_table(:sidebars) do
      primary_key :id
      foreign_key :unit_id, :units, :type=>String, :null=>false
      String :kind, :null=>false
      Integer :ordering, :null=>false
      String :attrs, :type=>'JSON'
      unique [:ordering, :unit_id]
    end

    create_table(:issues) do
      primary_key :id
      foreign_key :unit_id, :units, :type=>String, :null=>false
      String :volume, :null=>false
      String :issue, :null=>false
      DateTime :pub_date
      String :cover_page
    end

    create_table(:sections) do
      primary_key :id
      foreign_key :issue_id, :issues, :type=>Integer, :null=>false
      String :name, :null=>false
      Integer :ordering, :null=>false
      unique [:ordering, :issue_id]
    end

    create_table(:items) do
      String :id, :primary_key=>true
      String :source, :null=>false
      String :status, :null=>false
      String :title
      String :content_type, :null=>false
      String :genre, :null=>false
      DateTime :pub_date, :null=>false
      DateTime :eschol_date, :null=>false
      String :attrs, :type=>'JSON'
      String :rights, :null=>false
      foreign_key :section, :sections, :type=>Integer
      Integer :ordering_in_sect
      unique [:ordering_in_sect, :section]
    end

    create_table(:unit_items) do
      foreign_key :unit_id, :units, :type=>String, :null=>false
      foreign_key :item_id, :items, :type=>String, :null=>false
      Integer   :ordering_of_units, :null=>false
      TrueClass :is_direct
      unique [:unit_id, :item_id]
      unique [:ordering_of_units, :item_id]
    end

    create_table(:people) do
      String :id, :primary_key=>true, :type=>String
      String :attrs, :type=>'JSON' 
    end

    create_table(:item_authors) do
      foreign_key :item_id, :items, :type=>String, :null=>false
      foreign_key :person_id, :people, :type=>String  # allow NULL for now
      Integer :ordering, :null=>false
      String :attrs, :type=>'JSON'
    end

    # Eventually unit_counts and item_counts will be in a separate DB, but for now we'll lump them in.
    create_table(:unit_counts) do
      foreign_key :unit_id, :units, :type=>String, :null=>false
      String :month, :null=>false
      Integer :hits
      Integer :downloads
      unique [:month, :unit_id]
    end
    create_table(:item_counts) do
      foreign_key :item_id, :items, :type=>String, :null=>false
      String :month, :null=>false
      Integer :hits
      Integer :downloads
      unique [:month, :item_id]
    end

  end
end
