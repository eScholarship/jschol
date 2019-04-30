port ENV['PUMA_PORT']
workers ENV['PUMA_WORKERS']
threads 0, ENV['PUMA_THREADS']
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
  puts "PumaWorkerKiller (pre-start) RAM size: #{megs} mb"
  limit = [[512, megs/2].max, 2048].min  # default to half of RAM but clamp to range [512..2048]
  puts "PumaWorkerKiller (pre-start) setting limit at #{limit} mb"
  PumaWorkerKiller.config do |config|
    config.ram           = limit # mb
    config.percent_usage = 1.0 # kill when our app reaches the specified limit
    config.frequency     = 120  # seconds
  end
  PumaWorkerKiller.start
end

# We run a child Node Express process for isomorphic javascript rendering.
# Let's be certain it shuts down when we do.
def startIsoServer
  port = ENV['ISO_PORT'] && !$isoPid or return
  jscholDir = File.dirname(File.expand_path(File.dirname(__FILE__)))
  $isoPid = spawn("node app/isomorphic.js")
  Thread.new {
    Process.wait($isoPid)
    $isoPid = nil
  }
  at_exit {
    $isoPid and Process.kill("TERM", $isoPid)
  }
end

before_fork do
  setupWorkerKiller
end

after_worker_fork do
  startIsoServer
end

on_worker_boot do |num|
  $workerNum = num
  $workerPrefix = num.to_s + "."
  $nextThreadNum = 0
end
