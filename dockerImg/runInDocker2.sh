#!/bin/bash

set -e

cd /home/jschol/inner_jschol
mkdir -p dockerImg
cp /outer_jschol/dockerImg/runInDocker3.sh dockerImg/
cp /outer_jschol/config/env* config/
dockerImg/runInDocker3.sh
