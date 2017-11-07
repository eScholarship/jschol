#!/usr/bin/env bash

echo "Starting jschol in a Docker container."
docker run -v "${PWD}:/outer_jschol" -p 4001:4001 -p 35729:35729 -it escholarship/jschol /outer_jschol/dockerImg/runInDocker2.sh