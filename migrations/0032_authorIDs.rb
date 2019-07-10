# Index author identifiers to speed up ORCID and local ID querying
Sequel.migration do
  up do
    alter_table(:item_authors) do
      add_column :orcid_virtual, String, generated_always_as: Sequel.lit("json_unquote(json_extract(`attrs`,'$.ORCID_id'))"),
                                         generated_type: :virtual
      add_column :berkid_virtual, String, generated_always_as: Sequel.lit("json_unquote(json_extract(`attrs`,'$.BerkLaw_id'))"),
                                          generated_type: :virtual
      add_index [:orcid_virtual]
      add_index [:berkid_virtual]
    end
  end

  down do
    alter_table(:item_authors) do
      drop_index [:orcid_virtual]
      drop_index [:berkid_virtual]
      drop_column :orcid_virtual
      drop_column :berkid_virtual
    end
  end
end
