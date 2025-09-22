#!/usr/bin/env bash
set -euo pipefail
set -x

# Replace the Ruby upstream/location to talk to 127.0.0.1:3000
cat >/etc/nginx/conf.d/elasticbeanstalk-nginx-ruby-upstream.conf <<'NGINX'
# Rewritten by postdeploy hook to target Node on :3000
upstream my_app {
    server 127.0.0.1:3000;
}
NGINX

# Validate and reload
nginx -t
systemctl reload nginx
