#!/usr/bin/env bash

# Creates symlinks to make the dev experience nicer; having an easy to type path for gulp is nice, and we like having
# the Puma config for dev workspaces in config/puma.rb. These symlinks are in .gitignore, they're just for devs

if [ ! -L /app/gulp ]; then
  printf "\n== Creating convenience symlink for gulp ==\n"
  ln -s /app/node_modules/.bin/gulp /app/gulp
fi

if [ ! -L /app/config/puma.rb ]; then
  printf "\n== Creating configuration symlink for Puma ==\n"
  ln -s /app/dev/puma.rb /app/config/puma.rb
fi