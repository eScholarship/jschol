#!/usr/bin/env ruby

# This script copies dev's database to a copy here

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'pp'
require 'time'

dbName = ARGV[0] or raise("Missing db name")

# First, drop database, if it exists.
puts "Dropping old #{dbName} db (ignore error if any)."
`echo "drop database #{dbName}" | mysql --defaults-extra-file=/apps/eschol/.passwords/jschol_dba_pw.mysql`

puts "Creating #{dbName} db."
`echo "create database #{dbName}" | mysql --defaults-extra-file=/apps/eschol/.passwords/jschol_dba_pw.mysql`

puts "Copying all data from dev (takes about 2 min)."
`ssh pub-jschol-dev.escholarship.org "mysqldump --defaults-extra-file=/apps/eschol/.passwords/eschol_dump_pw.mysql --skip-lock-tables eschol_test" | mysql --defaults-extra-file=/apps/eschol/.passwords/jschol_dba_pw.mysql --database #{dbName}`

puts "Done."
