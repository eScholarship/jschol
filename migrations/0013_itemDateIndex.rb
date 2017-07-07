# Add an index for efficiently sorting items by the date they arrived in eScholarship

Sequel.migration do
	change do
	  add_index :items, :eschol_date
	end
end