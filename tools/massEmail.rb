#!/usr/bin/env ruby

# This script propagates raw item events to month-based summations for each
# item, unit, and person.

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

# Run from the right directory (the parent of the tools dir)
Dir.chdir(File.dirname(File.expand_path(File.dirname(__FILE__))))

# Remainder are the requirements for this program
require 'cgi'
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

# Read secret Subi keys (so we can form valid unsubscribe links)
$subiSecrets = JSON.parse(File.read("/apps/eschol/.passwords/subiSecrets.json"))

# Secrets for sending mail through Amazon SES
$mail_options = { :address              => ENV['SES_SMTP_HOST'],
                  :port                 => 587,
                  :domain               => "submit.escholarship.org",
                  :user_name            => ENV['SES_SMTP_PASSWORD'],
                  :password             => ENV['SES_SMTP_USERNAME'],
                  :authentication       => "plain",
                  :enable_starttls_auto => true  }

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
    next unless line =~ %r{PRE ([^ ]+@[^ ]*escholarship\.org)/}
    dir = $1
    FileUtils.mkdir_p("./awsLogs/ses-logs/#{dir}")
    checkCall("aws s3 sync --profile instance --quiet --delete s3://cdl-shared-logs/ses/#{dir}/ ./awsLogs/ses-logs/#{dir}/")
  }
  FileUtils.touch("./awsLogs/ses-logs")
end

###################################################################################################
def processBounce(email, bounceDate, bounceKind)

  if bounceKind == "permanent"

    # Permanent on a date replaces temporary on that same date
    Bounce.where(email: email, date: bounceDate, kind: "temporary").delete

    # Avoid duplicates
    return unless Bounce.where(email: email, date: bounceDate, kind: bounceKind).empty?

    # We consider a single permanent bounce enough to stop sending.
    needMark = (Date.today - bounceDate) < 90

  else # temporary

    # Avoid duplicates
    return unless Bounce.where(email: email, date: bounceDate).empty?

    # If we get two temporary bounces within 90 days, that's enough to stop sending.
    prev = Bounce.where(email: email).order(Sequel::desc(:date)).first
    needMark = prev && ((Date.today - prev.date) < 90 && (Date.today - bounceDate) < 90)

  end

  # If we need to mark them as bouncing, there's work to do.
  if needMark

    # We got a permanent bounce, or two bounces within 90 days of today; mark the user as 'bouncing'
    if bounceKind == "permanent"
      STDERR.puts "Email #{email} got permanent bounce; will mark."
    else
      STDERR.puts "Email #{email} bounced twice (#{prev.date} and #{bounceDate}); will mark."
    end

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

  # Record that we've processed this one, to avoid future repetition.
  Bounce.create(email: email, date: bounceDate, kind: bounceKind)
end

###################################################################################################
# Process any new bounce notifications
def processBounces
  grabBounceLogs

  STDERR.puts "Processing SES bounces."
  Dir.glob("./awsLogs/ses-logs/**/*").sort.each { |fn|
    next unless File.file?(fn)
    fn =~ %r{Bounce/(\d\d\d\d)-(\d\d)-(\d\d)} or raise("Warning: unexpected SES file #{fn}")
    bounceDate = Date.new($1.to_i, $2.to_i, $3.to_i)

    stuff = JSON.parse(File.read(fn))
    bounceKind = stuff.dig('bounce', 'bounceKind') || stuff.dig('bounce', 'bounceType') or
      raise("Can't find bounceKind in #{fn}")
    %w{Permanent Transient}.include?(bounceKind) or raise("Unrecognized bounceKind #{bounceKind.inspect}")
    bounceKind.downcase!

    recips = stuff.dig('bounce', 'bouncedRecipients') or raise("Can't parse bounce in #{fn}")
    recips.each { |recip|
      email = recip['emailAddress'] or raise("Can't parse bounce in #{fn}")
      email = email.strip.downcase
      email =~ /.*@.*\..*/ or raise("Strange email #{email.inspect} in #{fn}")
      processBounce(email, bounceDate, bounceKind)
    }
  }
end

###################################################################################################
# Temporary processing of old-style mail logs before we moved to SES
def processMaillog
  STDERR.puts "Processing /var/log/maillog* bounces (temporary)."

  authorEmails = Set.new
  Person.all { |person|
    next unless person.attrs
    attrs = JSON.parse(person.attrs)
    attrs['email'] and authorEmails << attrs['email']
    (attrs['prev_emails'] || []).each { |email| authorEmails << email }
  }
  ItemAuthor.all { |auth|
    next unless auth.attrs
    attrs = JSON.parse(auth.attrs)
    attrs['email'] and authorEmails << attrs['email']
  }

  permanentReasons = Hash.new { |h,k| h[k] = 0 }
  temporaryReasons = Hash.new { |h,k| h[k] = 0 }
  bounces = Hash.new { |h,k| h[k] = Set.new }

  Dir.glob("/var/log/maillog*").sort.each { |fn|
    next unless File.file?(fn)
    fileDate = File.ctime(fn)
    File.readlines(fn).each { |line|
      if !(line =~ /^(\w+)\s+(\d+).*to=<([^>]+)>.*status=(bounced|expired|deferred)[\s,:]*(.*)/)
        if line =~ /to=.*status=/ && !(line =~ /status=sent/)
          raise "Should have recognized line #{line.inspect}"
        end
        next
      end
      monthName, day, email, status, reason = $1, $2, $3, $4, $5

      email = email.strip.downcase
      if !authorEmails.include?(email)
        #puts "Skipping non-author: #{email}"
        next
      end

      month = Date::ABBR_MONTHNAMES.index(monthName) or raise("can't parse month name #{monthName.inspect}")
      bounceDate = Date.new(fileDate.year, month, day.to_i)

      # Shorten the reason text to make it easier to combine
      reason.gsub! %r{[-\w_.]+@[-\w_.]+}, 'EMAIL'
      reason.gsub! %r{http[^ ]+}, 'URL'
      reason.gsub! %r{Learn more at.*}, 'LEARNMORE'
      reason.gsub! %r{\(in reply to [^)]+\)}, ''
      reason.gsub! %r{\w+\d[\w\d._-]{3,99}}, 'IDSTR'

      if status == "bounced" || status == "expired"
        # OJS sent a bunch via SES before we realized it's not authorized. Skip these.
        next if reason =~ /Message rejected: Email address is not verified/

        # SPF policy violations and other temporary things that will, hopefully, be cleared up
        # by moving to SES.
        if reason =~ /SPF|Sender Policy Framework|detected as spam|DMARC|access denied|policy|temporar/i ||
           reason =~ /Invalid IP|spam filter|not allowed to send mail|Sender address/i ||
           reason =~ /Sender is not authorized|Sender spoofing|content denied/i
          bounceKind = "temporary"
        else
          bounceKind = "permanent"
        end
      else  # status=deferred
        bounceKind = "temporary"
      end

      if bounceKind == "temporary"
        temporaryReasons[reason] += 1
      else
        permanentReasons[reason] += 1
      end

      bounces[email] << [bounceKind, bounceDate]
    }
  }

  #puts "Permanent reasons:"
  #pp permanentReasons.sort{ |a,b| b[1] <=> a[1] }
  #puts "\nTemporary reasons:"
  #pp temporaryReasons.sort{ |a,b| b[1] <=> a[1] }

  nTemp = 0
  nPerm = 0
  bounces.each { |email, events|
    permDate = tempDate = nil
    events.sort.each { |event|
      if event[0] == "temporary" && (tempDate.nil? or tempDate < event[1])
        tempDate = event[1]
      elsif event[0] == "permanent" && (permDate.nil? or permDate < event[1])
        permDate = event[1]
      end
    }
    if permDate
      nPerm += 1
      processBounce(email, permDate, "permanent")
    else
      nTemp += 1
      processBounce(email, tempDate, "temporary")
    end
  }
  puts "nPerm=#{nPerm} nTemp=#{nTemp} nTotal=#{nPerm + nTemp}"
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
def fetchPeople(callback, recentHitsOnly)
  if recentHitsOnly
    DB.fetch(%{
      select distinct
        people.id,
        JSON_UNQUOTE(people.attrs->'$.email') email
      from people
      join item_authors on item_authors.person_id = people.id
      join item_stats on item_stats.item_id = item_authors.item_id
      where month = ?
      and item_stats.attrs->"$.hit" is not null
    }, (Date.today<<1).year*100 + (Date.today<<1).month).map { |row|
      callback.call(row[:email].downcase, row[:id])
    }
  else
    Person.each { |person|
      callback.call(JSON.parse(person.attrs)['email'].downcase, person.id)
    }
  end
end

###################################################################################################
def buildUsers(group, filter)
  # We want to exclude everybody that is bouncing or opted out of emails
  omitEmails = Set.new(OJS_DB.fetch(%{
    select distinct email from users
    inner join user_settings on user_settings.user_id = users.user_id
    where setting_name in ('eschol_bouncing_email', 'eschol_opt_out')
    and setting_value = 'yes'
  }.unindent).map { |row| row[:email].downcase })

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
    filterFunc = lambda { |email, person|
      !omitEmails.include?(email) and result[email][:people] << person
    }
    fetchPeople(filterFunc, filter == "recent-hits")
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

  escapedEmail = CGI.escape(email)
  optoutKey = Digest::SHA1.hexdigest($subiSecrets['optoutSecret'] + email)[0,10]
  unsubscribeLink = "https://submit.escholarship.org/subi/optout?e=#{escapedEmail}&k=#{optoutKey}"

  !vars[:people] || vars[:people].length <= 1 or raise("multiple people for email #{email}: #{vars[:people].inspect}")
  person = vars[:people] && !vars[:people].empty? && vars[:people].to_a[0].sub(%r{^ark:/99166/}, '')

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
    if prevEmailed && (Date.today - prevEmailed.date) < 21
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

    htmlBody = body.join("\n")
    textBody = htmlBody.gsub(%r{<a href="([^"]+)">}, '\1 : ').gsub(/<[^>]+>/, '').gsub("’", "'")

    mail = Mail.new do
      from     fromAddr
      to       toAddr
      subject  subject
      text_part do
        content_type 'text/plain; charset=UTF-8'
        body         textBody
      end
      html_part do
        content_type 'text/html; charset=UTF-8'
        body         htmlBody
      end
    end
    if mode == "go4it"
      # Okay, go forth and send the email
      mail.delivery_method :smtp, $mail_options
      mail.deliver

      # Mark this as sent, in case we're interrupted and need to resume where we left off.
      if !$testMode
        MassEmail.where(email: email, template: File.basename(tplFile)).delete
        MassEmail.create(email: email, template: File.basename(tplFile), date: Date.today)
      end

      sleep 0.5  # CDL-wide we have a 20 emails per second limit; hold this process to 2 per sec
    else
      puts "\n========================================================================================================="
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

# Update bounce records
processBounces
#processMaillog

# Build the list of users (uses the bounce records built above)
STDERR.puts "Building list of users."
users = buildUsers(group, filter)

# Generate all the emails
STDERR.puts "Generating emails to #{users.length} users."
generateEmails(template, users, mode)

STDERR.puts "Done."
