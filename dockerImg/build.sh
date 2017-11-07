#!/usr/bin/env bash

if [ "$#" -ne 1 ]; then
    echo "Usage: build.sh TAGNAME (e.g. 2017-B, 2017-C, etc.)"
    exit 1
fi

set -e

docker build -t escholarship/jschol .
docker tag escholarship/jschol escholarship/jschol:$1