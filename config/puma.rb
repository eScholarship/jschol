port ENV['PUMA_PORT']
workers ENV['PUMA_WORKERS']
threads 0, ENV['PUMA_THREADS']
worker_shutdown_timeout 90  # HTTP timeout is usually 60 sec, so give extra to be sure we don't drop any

on_worker_boot do |num|
  $workerNum = num
  $workerPrefix = num.to_s + "."
  $nextThreadNum = 0
end
