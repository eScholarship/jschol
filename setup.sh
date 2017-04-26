#!/usr/bin/env bash

# If an error occurs, stop this script
set -e

printf "== Installing local Ruby gems ==\n"
bundle install --path=gems --binstubs

printf "\n== Installing node packages (used by gulp and iso via Node) ==\n"
yarn install

printf "\n== Installing bower packages (used in browser) ==\n"
node_modules/.bin/bower install

printf "\n== Uninstalling bower packages no longer used ==\n"
node_modules/.bin/bower prune 
