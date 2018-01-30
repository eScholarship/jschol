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
require 'erb'
require 'fileutils'
require 'json'
require 'logger'
require 'mail'
require 'ostruct'
require 'pp'
require 'sequel'
require 'set'
require 'time'
require 'unindent'

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

# Log for debugging
#File.exists?('massEmail.sql_log') and File.delete('massEmail.sql_log')
#DB.loggers << Logger.new('massEmail.sql_log')

# Model class for each table
require_relative './models.rb'

OJS_DB = Sequel.connect({
  "adapter"  => "mysql2",
  "host"     => ENV["OJS_DB_HOST"] || raise("missing env OJS_DB_HOST"),
  "port"     => ENV["OJS_DB_PORT"] || raise("missing env OJS_DB_PORT").to_i,
  "database" => ENV["OJS_DB_DATABASE"] || raise("missing env OJS_DB_DATABASE"),
  "username" => ENV["OJS_DB_USERNAME"] || raise("missing env OJS_DB_USERNAME"),
  "password" => ENV["OJS_DB_PASSWORD"] || raise("missing env OJS_DB_HOST") })

$testMode = ARGV.delete("--test")

###################################################################################################
# Grab SES email logs and put them into our 'awsLogs' directory
def grabBounceLogs
  # If logs are fresh, skip.
  age = ((Time.now.to_i - File.mtime("./awsLogs/ses-logs").to_i) / 60 / 60.0).round(1)
  if age <= 18
    STDERR.puts "SES logs checked #{age} hours ago; skipping grab."
    return
  end

  STDERR.puts "Grabbing SES logs."
  # Note: on production there's an old ~/.aws/config file that points to different AWS credentials.
  #       We use an explicit "instance" profile (also defined in that file) to get back to plain
  #       default instance credentials.
  checkOutput("aws s3 ls --profile instance s3://cdl-shared-logs/ses/").split("\n").each { |line|
    next unless line =~ %r{(eschol@[^/]*)}
    dir = $1
    FileUtils.mkdir_p("./awsLogs/ses-logs/#{dir}")
    checkCall("aws s3 sync --profile instance --quiet --delete s3://cdl-shared-logs/ses/#{dir}/ ./awsLogs/ses-logs/#{dir}/")
  }
  FileUtils.touch("./awsLogs/ses-logs")
end

###################################################################################################
# Process any new bounce notifications
def processBounces
  grabBounceLogs

  STDERR.puts "Processing bounces."
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
        STDERR.puts "Email #{email} bounced twice (#{prev.date} and #{bounceDate}); will mark."

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
          STDERR.puts "...was already marked as bouncing."
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
def fetchEscholAdmins(callback)
  # List all users with eschol 'admin' or 'stats' roles
  OJS_DB.fetch(%{
    select email, unit_id from users
    inner join eschol_roles on eschol_roles.user_id = users.user_id
    where users.user_id > 1
    and users.user_id not in (
      select user_id from user_settings
      where setting_name in ('eschol_bouncing_email', 'eschol_opt_out')
        and setting_value = 'yes'
    )
    and role = 'admin' or role = 'stats'
  }).each { |row| callback.call(row[:email].downcase, row[:unit_id]) }
end

###################################################################################################
def fetchJournalManagers(callback)
  # Yield all OJS journal managers.
  # For reference, here are the OJS roles IDs (taken from: classes/security/Role.inc.php)
  #         1: journalAdmin
  #        16: journalManager
  #       256: journalEditor
  #       512: journalSectionEditor
  #       768: journalLayoutEditor
  #      4096: journalReviewer
  #      8192: journalCopyEditor
  #     12288: journalProofReader
  #     65536: journalAuthor
  #   1048576: journalReader
  #   2097152: journalSubscriptionManager
  OJS_DB.fetch(%{
    select email, path from journals
    inner join roles on roles.journal_id = journals.journal_id
    inner join users on users.user_id = roles.user_id
    where role_id = 16
    and users.user_id > 1
    and users.user_id not in (
      select user_id from user_settings
      where setting_name in ('eschol_bouncing_email', 'eschol_opt_out')
        and setting_value = 'yes'
    )
  }).each { |row| callback.call(row[:email].downcase, row[:path]) }
end

###################################################################################################
def buildUsers(group, filter)
  # We want to exclude everybody that is bouncing or opted out of emails
  omitEmails = Set.new
  OJS_DB.fetch(%{
    select distinct email from users
    inner join user_settings on user_settings.user_id = users.user_id
    where setting_name in ('eschol_bouncing_email', 'eschol_opt_out')
    and setting_value = 'yes'
  }.unindent).each { |row| omitEmails << row[:email].downcase }

  # Now build the result set
  result = Hash.new { |h,k| h[k] = Hash.new { |h2,k2| h2[k2] = Set.new } }
  if group == "stats-admins"
    omitUnits = Set.new(
      filter == "recent-hits" ? UnitStat.where(month: (Date.today<<1).year*100 + (Date.today<<1).month).
                                         where(Sequel.lit(%{attrs->"$.hit" is null})).select_map(:unit_id) :
      [])
    filterFunc = lambda { |email, unit|
      !omitEmails.include?(email) && !omitUnits.include?(unit) and result[email][:units] << unit
    }
    fetchEscholAdmins(filterFunc)
    fetchJournalManagers(filterFunc)
  elsif group == "authors"
    raise("not yet implemented")
  else
    raise
  end
  return result
end

###################################################################################################
def generateEmail(tpl, email, vars, allUnits, allHier)
  units = vars[:units].to_a
  units.delete_if { |id| !allHier[id] }
  units = units.map{ |id| allUnits[id]||{} }.map { |u|
    parents = allHier[u[:id]]
    parent = parents && allUnits[parents[0][:ancestor_unit]]
    OpenStruct.new(id: u[:id], name: (parent ? parent[:name]+": " : "") + u[:name], type: u[:type],
                   url: "https://escholarship.org/uc/#{u[:id]}")
  }.sort { |a,b| a[:name] <=> b[:name] }
  return tpl.result(binding)
end

###################################################################################################
def generateEmails(tplFile, users, mode)
  allUnits = Unit.to_hash(:id)
  allHier = UnitHier.filter(is_direct: true).to_hash_groups(:unit_id)
  tpl = ERB.new(File.read(tplFile))

  nTodo = users.length
  nDone = 0
  nSkipped = 0

  users.each { |email, vars|
    # Give feedback once in a while.
    if (nDone % 100) == 0
      STDERR.puts "Processed #{nDone}/#{nTodo}#{nSkipped>0 ? " (#{nSkipped} skipped - sent previously)" : ""}"
    end

    # Restartability: avoid sending the same email to the same person unless 3 wks have passed
    prevEmailed = MassEmail.where(email: email, template: File.basename(tplFile)).first
    if prevEmailed and (Date.today - prevEmailed.date) < 21
      #STDERR.puts "Skipping #{email} (already sent on #{prevEmailed.date})"
      nSkipped += 1
      nDone += 1
      next
    end

    body = generateEmail(tpl, email, vars, allUnits, allHier)
    body = body.split("\n")
    body.shift =~ /^From: (.*)$/ or raise("Template must have From: as first line")
    fromAddr = $1
    body.shift =~ /^Subject: (.*)$/ or raise("Template must have Subject: as second line")
    subject = $1
    toAddr = email
    if $testMode
      toAddr = "martin.haye@gmail.com"
    end

    mail = Mail.new do
      from     fromAddr
      to       toAddr
      subject  subject
      text_part do
        content_type 'text/plain; charset=UTF-8'
        body   body.join("\n").gsub(%r{<a href="([^"]+)">}, '\1: ').gsub(/<[^>]+>/, '')
      end
      html_part do
        content_type 'text/html; charset=UTF-8'
        body   body.join("\n")
      end
    end
    if mode == "go4it"
      # Okay, go forth and send the email
      mail.delivery_method :sendmail
      mail.deliver

      # Mark this as sent, in case we're interrupted and need to resume where we left off.
      MassEmail.where(email: email, template: File.basename(tplFile)).delete
      MassEmail.create(email: email, template: File.basename(tplFile), date: Date.today)

      sleep 0.5  # CDL-wide we have a 20 emails per second limit; hold this process to 2 per sec
    else
      STDERR.puts "\n========================================================================================================="
      puts mail
      STDOUT.flush
    end
    if $testMode
      STDERR.puts "Exiting early (test mode)."
      exit 1
    end

    nDone += 1
  }
  STDERR.puts "Processed #{nDone}/#{nTodo}#{nSkipped>0 ? " (#{nSkipped} skipped - sent previously)" : ""}."
end

###################################################################################################
def usage
  STDERR.puts %{
    Usage: massEmail.rb group filter template mode
      where 'group' is one of: stats-admins, authors
            'filter' is one of: recent-hits, all
            'template' is the filename of an erb email template
            'mode' is one of: preview, go4it
  }.unindent.strip
  exit 1
end

###################################################################################################
# The main routine

# Parse args
ARGV.length == 4 or usage
group, filter, template, mode = ARGV
%w{stats-admins authors}.include?(group) or usage
%w{recent-hits all}.include?(filter) or usage
%w{preview go4it}.include?(mode) or usage
File.file?(template) or raise("File not found: #{template}")

# Build the list of users
STDERR.puts "Building list of users."
users = buildUsers(group, filter)

# Update bounce records
processBounces

# Generate all the emails
STDERR.puts "Generating emails to #{users.length} users."
generateEmails(template, users, mode)

puts "Done."
