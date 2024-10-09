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
bundle binstubs --all

