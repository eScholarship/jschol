Sequel.migration do
  change do
    create_table(:bounces) do
      String :email, null: false
      Date   :date, null: false
      index [:email, :date], unique: true
    end
  end
end
