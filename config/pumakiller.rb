worker_timeout 120 # the default of 60 is usually hit on first startup, since this is a dev instance, we can wait
worker_shutdown_timeout 90  # HTTP timeout is usually 60 sec, so give extra to be sure we don't drop any

# The jschol memory leak has been very hard to track down, so a kludge is needed to
# keep the app responsive. Previously we were using a cronjob to restart periodically,
# but in a Beanstalk world it makes more sense to do it based on RAM consumption.
def setupWorkerKiller
  require 'vmstat'
  require 'puma_worker_killer'
  require 'sigdump/setup'     # enables stack trace (to /tmp/sigdump_pid.txt) if you send SIGCONT to process
  mem = Vmstat.snapshot.memory
  megs = mem.pagesize * (mem.wired + mem.active + mem.inactive + mem.free) / 1024 / 1024
  limit = [[512, megs/2].max, 2048].min  # default to half of RAM but clamp to range [512..2048]
  puts "PumaWorkerKiller (pre-start) RAM size: #{megs} mb, setting limit at #{limit} mb"
  PumaWorkerKiller.config do |config|
    config.ram           = limit # mb
    config.percent_usage = 1.0 # kill when our app reaches the specified limit
    config.frequency     = 120  # seconds
  end
  PumaWorkerKiller.start
end

before_fork do
  setupWorkerKiller
end

on_worker_boot do |num|
  $workerNum = num
  $workerPrefix = num.to_s + "."
  $nextThreadNum = 0
end
