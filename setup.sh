#!/usr/bin/env bash

# If an error occurs, stop this script
set -e

printf "== Installing local Ruby gems ==\n"
bundle install --quiet --path=gems --binstubs

#printf "\n== Uninstalling Ruby gems no longer used ==\n"
bundle clean

printf "\n== Installing node packages (used by gulp and iso via Node) ==\n"
npm install

if [[ `/bin/hostname` == "*pub-submit*" ]]; then
  printf "\n== Building splash page generator ==\n"
  cd splash
  ./setupSplash.sh
  cd ..
fi
