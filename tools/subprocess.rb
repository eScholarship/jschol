require 'open3'

###################################################################################################
# Translate list of args to a shell-escaped command line for debugging purposes
def strCmd(cmd)
  return cmd if not(cmd.is_a?(Array))
  cmd.map { |w|
    w =~ /[ "']/ ? ('"' + w.gsub('"', '\"') + '"') :
    w
  }.join(' ')
end

###################################################################################################
# Call a system command and return stdout as a string. Throw an exception if
# the command fails (i.e. exits with a non-zero status).
#
def checkOutput(cmd, debug=true)
  puts "$ '#{strCmd(cmd)}'" if debug
  stdout, stderr, status = Open3.capture3(*cmd)
  print stderr
  if not status.success?
    print stdout
    raise("Command '#{strCmd(cmd)}' failed with code #{status.exitstatus}")
  end
  return stdout
end

###################################################################################################
# Call a system command and throw an exception if the command exits with a non-zero status.
def checkCall(cmd, debug=true)
  if debug
    puts "$ #{strCmd(cmd)}"
  end
  system(*cmd)
  if not $?.success?
    raise("Command '#{strCmd(cmd)}' failed with code #{$?.exitstatus}")
  end
end
