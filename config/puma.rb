port ENV['PUMA_PORT']
workers ENV['PUMA_WORKERS']
threads 0, ENV['PUMA_THREADS']
worker_shutdown_timeout 90  # HTTP timeout is usually 60 sec, so give extra to be sure we don't drop any

# The jschol memory leak has been very hard to track down, so a kludge is needed to
# keep the app responsive. Previously we were using a cronjob to restart periodically,
# but in a Beanstalk world it makes more sense to do it based on RAM consumption.
before_fork do
  require 'vmstat'
  require 'puma_worker_killer'
  mem = Vmstat.snapshot.memory
  megs = mem.pagesize * (mem.wired + mem.active + mem.inactive + mem.free) / 1024 / 1024
  puts "PumaWorkerKiller (pre-start) RAM size: #{megs} mb"
  limit = [[512, megs/2].max, 1500].min  # default to half of RAM but clamp to range [512..1500]
  puts "PumaWorkerKiller (pre-start) setting limit at #{limit} mb"
  PumaWorkerKiller.config do |config|
    config.ram           = limit # mb
    config.percent_usage = 1.0 # kill when our app reaches the specified limit
    config.frequency     = 120  # seconds
  end
  PumaWorkerKiller.start
end

on_worker_boot do |num|
  $workerNum = num
  $workerPrefix = num.to_s + "."
  $nextThreadNum = 0
end
