#!/usr/bin/env bash

# use bash strict mode
set -euo pipefail
IFS=$'\n\t'

# uncomment for debug
#set -x

printf "== Installing local Ruby gems ==\n"
gem install bundler
bundle install --quiet --path=gems --binstubs

#printf "\n== Uninstalling Ruby gems no longer used ==\n"
bundle clean

printf "\n== Installing node packages (used by gulp and iso via Node) ==\n"
npm install npm@10.8.1
npm install
npm install gulp-cli # shouldn't be necessary, but seems to be

# add a symlink to node_modules/.bin/gulp in the root directory, if necessary
if [ ! -L ./gulp ]; then
  ln -s node_modules/.bin/gulp ./gulp
fi