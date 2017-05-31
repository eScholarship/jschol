#!/usr/bin/env ruby

# This script copies one mysql database to another, on the same server. Unfortunately 
# this isn't a simple command in MySQL, and while there's a package, it's not available
# in the default AWS yum repos.

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'sequel'
require 'yaml'
require 'pp'

# Parse command line
if ARGV.length != 2
  STDERR.puts "Usage: #{__FILE__} db1 db2"
  exit 1
end
db1, db2 = ARGV

# Connect to the database server
config = YAML.load_file("config/database.yaml")
config["database"] = db1
DB = Sequel.connect(config)

# Get a list of the tables
tables = DB.fetch("SELECT table_name FROM information_schema.TABLES WHERE table_schema=?", db1).map { |row| row[:table_name] }

# Create the tables. We have to use the SHOW CREATE TABLE stmts to retain the
# constraints, but we don't know what order to do them. So just try, and when
# we fail, back off and try a different table. They'll all eventually work
# (barring a bizarre circular constraint chain).
DB.run "CREATE DATABASE #{db2}"
DB.run "USE #{db2}"
creationOrder = []
while !tables.empty?
	tbl = tables.shift
	begin
		DB.fetch("SHOW CREATE TABLE #{db1}.#{tbl}").each { |row|
			stmt = row[:"Create Table"]
			#puts stmt
			DB.run(stmt)
		}
		creationOrder << tbl
		puts "Created table #{tbl.inspect}."
	rescue
		tables << tbl
	end
end

# Now copy
creationOrder.each { |tbl|
	puts "Copying data into table #{tbl.inspect}."
  DB.run "INSERT INTO #{db2}.#{tbl} SELECT * FROM #{db1}.#{tbl}"
}

puts "Done."