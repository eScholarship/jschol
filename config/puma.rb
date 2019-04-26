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
  PumaWorkerKiller.config do |config|
    config.ram           = megs # mb
    config.percent_usage = 0.50 # kill when our app is > 50% of total RAM usage
    config.frequency     = 5    # seconds
  end
  PumaWorkerKiller.start
end

on_worker_boot do |num|
  $workerNum = num
  $workerPrefix = num.to_s + "."
  $nextThreadNum = 0
end
