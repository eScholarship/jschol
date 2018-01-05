#!/usr/bin/env ruby

# This script renames one mysql database to another. Unfortunately this isn't
# a simple command in MySQL. The reasons are apparently compelling but obscure.

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'sequel'
require 'yaml'

# Parse command line
if ARGV.length != 2
  STDERR.puts "Usage: #{__FILE__} db1 db2"
  exit 1
end
db1, db2 = ARGV

# Connect to the database server
DB = Sequel.connect({
  "adapter"  => "mysql2",
  "host"     => ENV["ESCHOL_DB_HOST"] || raise("missing env ESCHOL_DB_HOST"),
  "port"     => ENV["ESCHOL_DB_PORT"] || raise("missing env ESCHOL_DB_PORT").to_i,
  "database" => db1,
  "username" => ENV["ESCHOL_DB_USERNAME"] || raise("missing env ESCHOL_DB_USERNAME"),
  "password" => ENV["ESCHOL_DB_PASSWORD"] || raise("missing env ESCHOL_DB_HOST") })

# Get a list of the tables
tables = DB.fetch("SELECT table_name FROM information_schema.TABLES WHERE table_schema=?", db1).map { |row| row[:table_name] }

# Create the new database and move each table to it
DB.run "CREATE DATABASE #{db2}"
tables.each { |tbl|
  DB.run "RENAME TABLE #{db1}.#{tbl} TO #{db2}.#{tbl}"
}

# Finally, drop the old database
DB.run "DROP DATABASE #{db1}"