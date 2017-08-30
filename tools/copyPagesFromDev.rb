#!/usr/bin/env ruby

# This script copies root-level and campus CMS pages from dev to this machine.

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'pp'
require 'time'

# First, drop any eschol_fromdev database, if it exists.
puts "Dropping old eschol_fromdev db (ignore error if any)."
`echo "drop database eschol_fromdev" | mysql --defaults-extra-file=/apps/eschol/.passwords/eschol_dba_pw.mysql`

puts "Creating eschol_fromdev db."
`echo "create database eschol_fromdev" | mysql --defaults-extra-file=/apps/eschol/.passwords/eschol_dba_pw.mysql`

puts "Copying all data from dev (takes about 2 min)."
`ssh pub-jschol-dev.escholarship.org "mysqldump --defaults-extra-file=/apps/eschol/.passwords/eschol_dump_pw.mysql --skip-lock-tables eschol_test" | mysql --defaults-extra-file=/apps/eschol/.passwords/eschol_dba_pw.mysql --database eschol_fromdev`

puts "Copying root pages."
`echo "update units u1 set attrs = (select attrs from eschol_fromdev.units u2 where u2.id = u1.id) where type in ('root', 'campus')" | mysql --defaults-extra-file=/apps/eschol/.passwords/eschol_dba_pw.mysql`
`echo "delete from pages where unit_id in (select id from units where type in ('root', 'campus'))" | mysql --defaults-extra-file=/apps/eschol/.passwords/eschol_dba_pw.mysql`
`echo "insert into pages (unit_id, name, title, slug, attrs) select unit_id, name, title, slug, attrs from eschol_fromdev.pages where unit_id in (select id from eschol_fromdev.units where type in ('root', 'campus'))" | mysql --defaults-extra-file=/apps/eschol/.passwords/eschol_dba_pw.mysql`

puts "Done."