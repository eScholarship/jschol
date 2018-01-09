port ENV['PUMA_PORT']
workers ENV['PUMA_WORKERS']
threads 0, ENV['PUMA_THREADS']

on_worker_boot do |num|
  $workerNum = num
  $workerPrefix = num.to_s + "."
  $nextThreadNum = 0
end
