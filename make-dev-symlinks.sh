#!/usr/bin/env bash

# Creates symlinks to make the dev experience nicer; the Puma config for dev workspaces lives in config/puma.rb.
# These symlinks are in .gitignore, they're just for devs

if [ ! -L /app/config/puma.rb ]; then
  printf "\n== Creating configuration symlink for Puma ==\n"
  ln -s /app/dev/puma.rb /app/config/puma.rb
fi