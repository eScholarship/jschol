#!/usr/bin/env bash

# If an error occurs, stop this script
set -e

printf "== Installing local Ruby gems ==\n"
bundle install --path=gems --binstubs

printf "\n== Installing node packages (used by gulp and iso via Node) ==\n"
set +e
type yarn 2>/dev/null
YARNSTATUS=$?
set -e
if [[ $YARNSTATUS == "0" ]]; then
  yarn install
else
  npm install
fi

printf "\n== Installing bower packages (used in browser) ==\n"
node_modules/.bin/bower install
