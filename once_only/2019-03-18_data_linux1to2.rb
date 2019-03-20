#!/usr/bin/env ruby

require 'date'
require 'open3'

$ignoreErrors = ARGV.delete("--ignore-errors")

# Make sure we're running on a designated machine (could be dangerous run from elsewhere)
$host = `/bin/hostname`.chomp
okHosts = %w{pub-submit2-dev pub-submit2-stg pub-submit2-prd}
okHosts.include?($host) or raise "This script is intended to run only on #{okHosts.join(" ")}."

# No tasks should be running
if `/apps/eschol/bin/eye info` =~ / up /
  puts "Oops, services are still running. Be sure to shut off all services and cron jobs."
  exit 1
end

def runCmd(cmd)
  puts
  puts "-------------------------------------------------------------------------------------------"
  puts "-- #{DateTime.now.iso8601}"
  puts "-- #{cmd}"
  puts
  if !system(cmd)
    status = $?.exitstatus
    msg = "#{cmd} exited with status #{status}"
    if $ignoreErrors
      puts "Warning: #{msg}"
    else
      raise msg
    end
  end
end

# Okay, we've got a whole list of general directories to sync.
dirs = [
  "sword/biomed",
  "apache/logs",
  "eschol5/jschol/awsLogs",
  "erep/statistics",
  "erep/xtf/bpRedirect",
  "erep/xtf/control/db",
  "erep/xtf/control/logs",
  "erep/xtf/dojRedirect",
  "erep/xtf/indexes",
  "erep/xtf/ripCache",
  "erep/xtf/stats",
  "linkBack",
  "oa_report",
  "ojs",
  "repec",
  "subi/pub-oapi",
  "tomcat/logs",
  "tmp",
  "erep/data",
  "erep/data_sequester",
  "erep/data_shadow",
]

srcMachine = "#{$host.sub('submit2', 'submit')}.escholarship.org"
srcMachine != $host or raise("failed to map to source machine name")

# Remove extraneous index links.
`rm -f /apps/eschol/erep/xtf/index`
`rm -f /apps/eschol/erep/xtf/index-new`
`rm -f /apps/eschol/erep/xtf/index-pending`
`rm -f /apps/eschol/erep/xtf/index-spare`
`rm -f /apps/eschol/erep/xtf/preview-index`
`rm -f /apps/eschol/erep/xtf/preview-index-new`
`rm -f /apps/eschol/erep/xtf/preview-index-pending`
`rm -f /apps/eschol/erep/xtf/preview-index-spare`

# Copy the main index links as well
runCmd("rsync -av pub-submit-dev.escholarship.org:/apps/eschol/erep/xtf/index /apps/eschol/erep/xtf/index")
runCmd("rsync -av pub-submit-dev.escholarship.org:/apps/eschol/erep/xtf/preview-index /apps/eschol/erep/xtf/preview-index")

dirs.each { |dir|
  cmd = "rsync -a"
  #cmd += " --dry-run"

  # Only preserve local changes in tmp; for other dirs, blow local changes away
  if dir == "tmp"
    cmd += %{ --filter="- rolling"}
  else
    cmd += " --delete"
  end

  # We only expect hard links amongst the indexes
  if dir == "erep/xtf/indexes"
    cmd += " --hard-links"
  end

  # Dev and stg don't have a data_shadow dir
  if dir == "erep/data_shadow" && $host =~ /dev|stg/
    next
  end

  # Dev and stg don't have an awsLogs dir
  if dir == "eschol5/jschol/awsLogs" && $host =~ /dev|stg/
    next
  end

  # Interested in logging changes to most dirs, but not indexes (too many, and all expected)
  if dir != "erep/xtf/indexes"
    cmd += " -v"
  end

  # Finish off the command and run it
  cmd += " #{srcMachine}:/apps/eschol/#{dir}/ /apps/eschol/#{dir}/"
  runCmd(cmd)
}

