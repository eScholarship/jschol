#!/usr/bin/env ruby

# Run from the right directory (the parent of the tools dir)
Dir.chdir(File.dirname(File.expand_path(File.dirname(__FILE__))))

require_relative './subprocess.rb'

# When we're called from within a bundled ruby script, we inherit a bunch of bundler env vars
# that don't apply to system-level stuff, especially 'eye'. So, get rid of them.
for var in ['BUNDLER_ORIG_PATH', 'BUNDLER_VERSION', 'BUNDLE_BIN_PATH', 'BUNDLE_GEMFILE', 'GEM_HOME', 'GEM_PATH', 'RUBYLIB', 'RUBYOPT']
  ENV[var] and ENV.delete(var)
end

# Stop relevant tasks managed by 'eye'
checkCall("eye stop jschol tomcat")

# Pull and update
checkCall("git pull origin master")
checkCall("./setup.sh")

# Restart tasks
checkCall("eye start jschol tomcat")
