Sequel.migration do
  change do
    create_table(:redirects) do
      primary_key :id
      String :kind,      :null=>false
      String :from_path, :null=>false
      String :to_path,   :null=>false
      String :descrip
      unique [:kind, :from_path]
    end
  end
end