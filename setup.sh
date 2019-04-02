#!/usr/bin/env bash

# If an error occurs, stop this script
set -e

printf "== Installing local Ruby gems ==\n"
bundle install --quiet --path=gems --binstubs

#printf "\n== Uninstalling Ruby gems no longer used ==\n"
bundle clean

printf "\n== Installing node packages (used by gulp and iso via Node) ==\n"
yarn install --silent

printf "\n== Patching React to suppress unavoidable warnings from sub-modules ==\n"
perl -pi -e 's/warnedForCreateClass = false/warnedForCreateClass = true/' node_modules/react/lib/React.js
perl -pi -e 's/didWarnPropTypesDeprecated = false/didWarnPropTypesDeprecated = true/' node_modules/react/lib/React.js

if [[ `/bin/hostname` == "*pub-submit*" ]]; then
  printf "\n== Building splash page generator ==\n"
  cd splash
  ./setupSplash.sh
  cd ..
fi
