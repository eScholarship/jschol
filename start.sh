#!/bin/sh
set -e

# Start Puma with the same options as in Procfile
exec bundle exec puma -C config/pumakiller.rb -b tcp://0.0.0.0:80 -t1:16 -w 3 & NODE_ENV=production node app/isomorphic.js
