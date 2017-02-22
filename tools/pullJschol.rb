#!/usr/bin/env ruby

# Run from the right directory (the parent of the tools dir)
Dir.chdir(File.dirname(File.expand_path(File.dirname(__FILE__))))

###################################################################################################
## Translate list of args to a shell-escaped command line for debugging purposes
def strCmd(cmd)
  return cmd if not(cmd.is_a?(Array))
  cmd.map { |w|
    w =~ /[ "']/ ? ('"' + w.gsub('"', '\"') + '"') :
    w
  }.join(' ')
end

###################################################################################################
## Call a system command and throw an exception if the command exits with a non-zero status.
def checkCall(cmd, debug=true)
  if debug
    puts "$ #{strCmd(cmd)}"
  end
  system(*cmd)
  if not $?.success?
    raise("Command '#{strCmd(cmd)}' failed with code #{$?.exitstatus}")
  end
end

# When we're called from within a bundled ruby script, we inherit a bunch of bundler env vars
# that don't apply to system-level stuff, especially 'eye'. So, get rid of them.
for var in ['BUNDLER_ORIG_PATH', 'BUNDLER_VERSION', 'BUNDLE_BIN_PATH', 'BUNDLE_GEMFILE', 'GEM_HOME', 'GEM_PATH', 'RUBYLIB', 'RUBYOPT']
  ENV[var] and ENV.delete(var)
end

# Stop all tasks managed by 'eye'
checkCall("eye stop jschol")

# Pull and update
checkCall("git pull upstream master")
checkCall("./setup.sh")

# Restart tasks
checkCall("eye start jschol")
