#!/usr/bin/env ruby

# This script "rolls up" Subi series-level admin permissions to eschol5 unit-level admin
# permissions. And it translates OJS "Journal Manager" permissions to journal and unit
# admin permissions in eschol5.

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Remainder are the requirements for this program
require 'pp'
require 'sequel'
require 'time'

# The OJS database, where permissions are stored
DB = Sequel.connect({
  "adapter"  => "mysql2",
  "host"     => ENV["OJS_DB_HOST"] || raise("missing env OJS_DB_HOST"),
  "port"     => ENV["OJS_DB_PORT"] || raise("missing env OJS_DB_PORT").to_i,
  "database" => ENV["OJS_DB_DATABASE"] || raise("missing env OJS_DB_DATABASE"),
  "username" => ENV["OJS_DB_USERNAME"] || raise("missing env OJS_DB_USERNAME"),
  "password" => ENV["OJS_DB_PASSWORD"] || raise("missing env OJS_DB_HOST") })

# eschol5 database used for grabbing unit hierarchy info
ESCHOL_DB = Sequel.connect({
  "adapter"  => "mysql2",
  "host"     => ENV["ESCHOL_DB_HOST"] || raise("missing env ESCHOL_DB_HOST"),
  "port"     => ENV["ESCHOL_DB_PORT"] || raise("missing env ESCHOL_DB_PORT").to_i,
  "database" => ENV["ESCHOL_DB_DATABASE"] || raise("missing env ESCHOL_DB_DATABASE"),
  "username" => ENV["ESCHOL_DB_USERNAME"] || raise("missing env ESCHOL_DB_USERNAME"),
  "password" => ENV["ESCHOL_DB_PASSWORD"] || raise("missing env ESCHOL_DB_HOST") })

# Mode to print out but don't execute
$testMode = ARGV.delete('--test')

Sequel::Model.db = ESCHOL_DB
class Unit < Sequel::Model
  unrestrict_primary_key
end

class UnitHier < Sequel::Model(:unit_hier)
  unrestrict_primary_key
end

Sequel::Model.db = DB
class EscholRole < Sequel::Model
  unrestrict_primary_key
end

class OjsRole < Sequel::Model(:roles)
  unrestrict_primary_key
end

###################################################################################################
def cacheAllUnits()
  # Build a list of all valid units
  $allUnits = Unit.map { |unit| [unit.id, unit] }.to_h

  # Build a cache of unit ancestors
  $unitParents = Hash.new { |h,k| h[k] = [] }
  UnitHier.where(is_direct: 1).each { |hier| $unitParents[hier.unit_id] << $allUnits[hier.ancestor_unit] }
end

###################################################################################################
def addAdminRole(userID, child, parent)
  print "#{child.type} #{child.id}: "
  if EscholRole.where(user_id: userID, unit_id: parent.id, role: "admin").empty?
    puts "roll up user #{userID} to #{parent.type} #{parent.id}"
    if !$testMode
      EscholRole.insert(user_id: userID, unit_id: parent.id, role: "admin")
    end
  else
    puts "dupe role for user #{userID} to #{parent.type} #{parent.id}"
  end
end

###################################################################################################
def rollupSeriesPerms()

  # Find all series-level admins
  EscholRole.where(role: "admin").order(:unit_id, :user_id).each { |row|
    userID, unitID = row.user_id, row.unit_id
    next if userID == 1  # skip help@escholarship
    unit = $allUnits[unitID]
    if !unit
      puts "Warning: Unknown unit #{unitID.inspect} for series user #{userID.inspect}"
      next
    end
    unit.type == "series" or next
    $unitParents[unit.id].each { |parentUnit|
      if parentUnit.type != "oru"
        puts "Warning: #{unitID}: Expecting parent #{parentUnit.id} to be oru but is #{parentUnit.type}"
        next
      end
      addAdminRole(userID, unit, parentUnit)
    }
  }

end

###################################################################################################
def rollupJournalPerms()

  # Find all journal managers. In OJS, that's role number 16.
  OjsRole.where(role_id: 16).join(:journals, journal_id: :journal_id).order(:path, :user_id).each { |row|
    userID, unitID = row.user_id, row[:path]
    next if userID == 1  # skip help@escholarship
    unit = $allUnits[unitID]
    if !unit
      puts "Warning: Unknown unit #{unitID.inspect} for journal user #{userID.inspect}"
      next
    end
    ["journal", "series"].include?(unit.type) or raise("OJS perms for non-journal, non-series #{unitID}")
    $unitParents[unit.id].each { |parentUnit|
      if parentUnit.type != "oru"
        puts "Warning: #{unitID}: Expecting parent #{parentUnit.id} to be oru but is #{parentUnit.type}"
        next
      end
      addAdminRole(userID, unit, parentUnit)
    }
  }

end

###################################################################################################
# The main routine
cacheAllUnits
rollupSeriesPerms
rollupJournalPerms
