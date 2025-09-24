#!/usr/bin/env bash
set -euo pipefail
set -x

# Replace the Ruby upstream/location to talk to 127.0.0.1:3000
cat >/etc/nginx/conf.d/elasticbeanstalk-nginx-ruby-upstream.conf <<'NGINX'
# Rewritten by postdeploy hook to target Node on :3000 for web traffic
# but Ruby on :18880 for API calls
upstream my_app {
    server 127.0.0.1:3000;
}

upstream ruby_api {
    server 127.0.0.1:18880;
}
NGINX

cat >/etc/nginx/conf.d/api-proxy.conf <<'NGINX'
# Route API calls directly to Ruby server
location /api/ {
    proxy_pass http://ruby_api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
NGINX

# Validate and reload
nginx -t
systemctl reload nginx
