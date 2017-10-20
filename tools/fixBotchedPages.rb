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

# Connect to the database server
config = YAML.load_file("config/database.yaml")
config["database"] = "eschol"
DB = MAIN_DB = Sequel.connect(config)

class Page < Sequel::Model
end

config["database"] = "eschol_fromDev_bad"
BAD_DB = Sequel.connect(config)

config["database"] = "eschol_fromDev_good"
GOOD_DB = Sequel.connect(config)

counts = Hash.new { |h,k| h[k] = 0 }

Page.order(:unit_id, :slug).each { |mainPage|
	unitID = mainPage[:unit_id]
	slug = mainPage[:slug]
	badPage = BAD_DB.fetch("SELECT * FROM PAGES WHERE unit_id = ? AND slug = ?", unitID, slug).first
	goodPage = GOOD_DB.fetch("SELECT * FROM PAGES WHERE unit_id = ? AND slug = ?", unitID, slug).first
	if !badPage || !goodPage
		#puts "New page: #{unitID} #{slug}"
		counts[:new] += 1
	elsif badPage[:attrs] == goodPage[:attrs]
		# Nothing to fix
		counts[:ok] += 1
	elsif mainPage[:attrs] == badPage[:attrs]
		puts "Fix: #{unitID} #{slug}"
		counts[:fixed] += 1
		#puts "from: #{mainPage[:attrs]}"
		#puts "  to: #{goodPage[:attrs]}"
		mainPage[:attrs] = goodPage[:attrs]
		mainPage.save
	else
		puts "Cannot fix page changed by user: #{unitID} #{slug}"
		counts[:protected] += 1
	end
}

puts "Done: #{counts}"