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

checkCall("eye quit -s")
checkCall("git pull upstream master")
checkCall("./setup.sh")
checkCall("eye load /apps/eschol/.eye/conf.rb")
