Sequel.migration do
  change do
    create_table(:mass_emails) do
      String :email, null: false
      String :template, null: false
      Date   :date, null: false
      index [:email, :template, :date], unique: true
    end
  end
end
