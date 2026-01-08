#!/bin/bash
# Remove old nginx proxy hook from previous deployment
# This hook runs once to clean up the old configuration

echo "Cleaning up old postdeploy hooks..."
rm -f /var/app/current/.platform/hooks/postdeploy/10-nginx-to-3000.sh
echo "Old hooks removed."

