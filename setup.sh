#!/usr/bin/env bash

# use bash strict mode
set -euo pipefail
IFS=$'\n\t'

# uncomment for debug
set -x

printf "== Installing local Ruby gems ==\n"
rm -rf gems bin Gemfile.lock
mkdir bin
bundle config --local set path gems
bundle install
bundle lock --add-platform x86_64-linux
bundle binstubs --all

printf "\n== Installing node packages (used by gulp and iso via Node) ==\n"
rm -rf node-modules
npm install

# add a symlink to node_modules/.bin/gulp in the root directory, if necessary
if [ ! -L ./gulp ]; then
  ln -s node_modules/.bin/gulp ./gulp
fi