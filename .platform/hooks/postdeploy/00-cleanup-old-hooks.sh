#!/bin/bash
# Restore nginx to default Puma configuration
# The old hook reconfigured nginx to proxy to port 3000, we need to undo that

echo "Restoring nginx to default Puma configuration..."

# Restore the default nginx upstream configuration
cat > /etc/nginx/conf.d/elasticbeanstalk-nginx-ruby-upstream.conf << 'EOF'
upstream my_app {
  server unix:///var/run/puma/my_app.sock;
}
EOF

# Test and reload nginx
nginx -t && systemctl reload nginx

echo "Nginx restored to Puma unix socket configuration."

