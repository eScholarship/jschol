#!/usr/bin/env ruby

# This script propagates raw item events to month-based summations for each
# item, unit, and person.

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Run from the right directory (the parent of the tools dir)
Dir.chdir(File.dirname(File.expand_path(File.dirname(__FILE__))))

# Remainder are the requirements for this program
require 'date'
require 'digest'
require 'fileutils'
require 'json'
require 'pp'
require 'sequel'
require 'set'
require 'time'

require_relative './subprocess.rb'

# Make puts synchronous (e.g. auto-flush)
STDOUT.sync = true

# Always use the right directory (the parent of the tools dir)
Dir.chdir(File.dirname(File.expand_path(File.dirname(__FILE__))))

# The main database we're inserting data into
DB = Sequel.connect({
  "adapter"  => "mysql2",
  "host"     => ENV["ESCHOL_DB_HOST"] || raise("missing env ESCHOL_DB_HOST"),
  "port"     => ENV["ESCHOL_DB_PORT"] || raise("missing env ESCHOL_DB_PORT").to_i,
  "database" => ENV["ESCHOL_DB_DATABASE"] || raise("missing env ESCHOL_DB_DATABASE"),
  "username" => ENV["ESCHOL_DB_USERNAME"] || raise("missing env ESCHOL_DB_USERNAME"),
  "password" => ENV["ESCHOL_DB_PASSWORD"] || raise("missing env ESCHOL_DB_HOST") })

# Model class for each table
require_relative './models.rb'

OJS_DB = Sequel.connect({
  "adapter"  => "mysql2",
  "host"     => ENV["OJS_DB_HOST"] || raise("missing env OJS_DB_HOST"),
  "port"     => ENV["OJS_DB_PORT"] || raise("missing env OJS_DB_PORT").to_i,
  "database" => ENV["OJS_DB_DATABASE"] || raise("missing env OJS_DB_DATABASE"),
  "username" => ENV["OJS_DB_USERNAME"] || raise("missing env OJS_DB_USERNAME"),
  "password" => ENV["OJS_DB_PASSWORD"] || raise("missing env OJS_DB_HOST") })

###################################################################################################
# Grab SES email logs and put them into our 'awsLogs' directory
def grabLogs
  # If logs are fresh, skip.
  latest = Dir.glob("./awsLogs/ses-logs/**/*").inject(0) { |memo, path| [memo, File.mtime(path).to_i].max }
  age = ((Time.now.to_i - latest) / 60 / 60.0).round(1)
  if age <= 18
    puts "SES logs grabbed #{age} hours ago; skipping grab."
    return
  end

  puts "Grabbing SES logs."
  # Note: on production there's an old ~/.aws/config file that points to different AWS credentials.
  #       We use an explicit "instance" profile (also defined in that file) to get back to plain
  #       default instance credentials.
  checkOutput("aws s3 ls --profile instance s3://cdl-shared-logs/ses/").split("\n").each { |line|
    next unless line =~ %r{(eschol@[^/]*)}
    dir = $1
    FileUtils.mkdir_p("./awsLogs/ses-logs/#{dir}")
    checkCall("aws s3 sync --profile instance --quiet --delete s3://cdl-shared-logs/ses/#{dir}/ ./awsLogs/ses-logs/#{dir}/")
  }
end

###################################################################################################
# Process any new bounce notifications
def processBounces
  puts "Processing bounces."
  Dir.glob("./awsLogs/ses-logs/**/*").sort.each { |fn|
    next unless File.file?(fn)
    fn =~ %r{Bounce/(\d\d\d\d)-(\d\d)-(\d\d)} or raise("Warning: unexpected SES file #{fn}")
    bounceDate = Date.new($1.to_i, $2.to_i, $3.to_i)
    stuff = JSON.parse(File.read(fn))
    recips = stuff.dig('bounce', 'bouncedRecipients') or raise("Can't parse bounce in #{fn}")
    recips.each { |recip|
      email = recip['emailAddress'] or raise("Can't parse bounce in #{fn}")
      email = email.strip.downcase
      email =~ /.*@.*\..*/ or raise("Strange email #{email.inspect} in #{fn}")
      next if Bounce.where(email: email, date: bounceDate).count > 0

      prev = Bounce.where(email: email).order(Sequel::desc(:date)).first
      if prev && (Date.today - prev.date) < 90 && (Date.today - bounceDate) < 90
        # We got two bounces within 90 days of today; mark the user as 'bouncing'
        puts "Email #{email} bounced twice (#{prev.date} and #{bounceDate}); will mark."

        # Add a user to the OJS users table if not already there
        user = OJS_DB[:users].where(email: email).first
        if !user
          OJS_DB[:users].insert(username: email,
                                password: '',
                                first_name: '',
                                last_name: '',
                                email: email,
                                date_registered: Date.today,
                                date_last_login: Date.today,
                                disabled: false)
          user = OJS_DB[:users].where(email: email).first
        end
        if OJS_DB[:user_settings].where(user_id: user[:user_id], setting_name: 'eschol_bouncing_email').first
          puts "...was already marked as bouncing."
        else
          OJS_DB[:user_settings].insert(user_id: user[:user_id],
                                        locale: "en_US",
                                        setting_name: "eschol_bouncing_email",
                                        setting_value: "yes",
                                        setting_type: "string")
        end
      end
      Bounce.create(email: email, date: bounceDate)
    }
  }
end

###################################################################################################
# The main routine
grabLogs
processBounces
puts "Done."
