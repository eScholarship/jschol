#!/usr/bin/env ruby

# This script calls Sequel's migration code. You can supply a particular version to
# migrate to, or omit it to migrate to the latest version.
#
# We do this as a wrapper rather than use sequel's command line because we need to
# extract the database config from env vars, while the cmd line requires a config file.

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'sequel'

# Parse command line
if ARGV.length > 1
  STDERR.puts "Usage: #{__FILE__} [migrationVersion]"
  exit 1
end
migrate_ver = ARGV[0] ? ARGV[0].to_i : nil

# Connect to the database server
DB = Sequel.connect({
  "adapter"  => "mysql2",
  "host"     => ENV["ESCHOL_DB_HOST"] || raise("missing env ESCHOL_DB_HOST"),
  "port"     => ENV["ESCHOL_DB_PORT"] || raise("missing env ESCHOL_DB_PORT").to_i,
  "database" => ENV["ESCHOL_DB_DATABASE"] || raise("missing env ESCHOL_DB_DATABASE").to_i,
  "username" => ENV["ESCHOL_DB_USERNAME"] || raise("missing env ESCHOL_DB_USERNAME"),
  "password" => ENV["ESCHOL_DB_PASSWORD"] || raise("missing env ESCHOL_DB_HOST") })

Sequel.extension :migration, :core_extensions
Sequel::Migrator.apply(DB, "migrations", migrate_ver)
