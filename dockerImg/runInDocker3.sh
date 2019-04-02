#!/bin/bash

set -e

rsync -a --exclude run.sh --exclude .git --exclude bin --exclude config --exclude gems --exclude node_modules --exclude app/js --exclude app/css /outer_jschol/ ./

source config/env.sh
config/env2config.sh

mkdir -p ~/.ssh
pushd ~/.ssh
echo "$SSH_KEY" > id_rsa
chmod 600 id_rsa
chmod 700 .
popd

./setup.sh

echo ""
echo "== Starting gulp =="
mkdir -p app/css app/js  # if they "appear" gulp watch will mistakenly run
./gulp
