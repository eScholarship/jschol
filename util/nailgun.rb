
# Utility for starting, stopping, and using nailgun to efficiently run a
# Java program (e.g. Saxon) many times in a row.

require 'open3'

##################################################################################
class Nailgun
  attr_reader :callCount

  # Very simple usage that takes advantage of Ruby's blocks:
  #
  # Nailgun.run { |ng|
  #     ng.transform(xslFile, inFile, outFile) # Saxon transform to file
  #     # or
  #     ng.call([param1,param2,...])           # call, return output as string
  # }

  def self.run(classPath, port = 0, systemProps = nil, &blk)
    inst = Nailgun.new
    inst.runInternal(classPath, port, systemProps, &blk)
  end

  #################################################################################################
  def runInternal(classPath, port = 0, systemProps = nil, &blk)
    # If no port specified, let the O/S pick one.
    if port == 0
      socket = Socket.new(:INET, :STREAM, 0)
      socket.bind(Addrinfo.tcp("127.0.0.1", 0))
      port = socket.local_address.ip_port
      socket.close
    end

    # Record the parameters so we can start/stop multiple times if needed
    @classPath = classPath
    @port = port
    @systemProps = systemProps

    # Start up, do the work, and always stop afterward
    begin
      blk.yield(self)
    ensure
      stopInternal
    end
  end

  #################################################################################################
  def startInternal
    return if @started

    @callCount = 0
    fullClassPath = "/apps/eschol/erep/xtf/control/xsl/nailgun.jar:#{@classPath}"
    cmd = "java -cp #{fullClassPath} #{@systemProps} -server com.martiansoftware.nailgun.NGServer #{@port} > nailgun.log 2>&1"
    @pid = spawn(cmd)

    # Wait for it to warm up
    begin
      retries ||= 0
      callInternal(true, false, "ng-version")
    rescue Exception => e
      sleep 0.1
      retry if (retries += 1) < 100
      raise("Nailgun failed to start within 10 seconds.")
    end
    @callCount = 0
    @started = true
  end

  #################################################################################################
  def stopInternal
    return if !@started

    # Tell nailgun to shut down
    begin
      callInternal(true, false, "ng-stop")
    rescue
      # ignore errors during stop
    end

    # And wait for the shutdown
    status = Process.wait2(@pid)[1]
    status == 0 or raise("Nailgun command failed with code #{status}")
    @started = false
  end

  #################################################################################################
  def callInternal(eatOutput, joinStderr, argStr)
    # Do the transform
    cmd = "/apps/eschol/bin/ng --nailgun-port #{@port} #{argStr}"
    #puts cmd
    @callCount += 1
    stdout, stderr, status = Open3.capture3(cmd)
    eatOutput or joinStderr or print stderr
    if !(status.success?) && !joinStderr
      eatOutput or print stdout
      raise("Command #{cmd.inspect} failed with code #{status.exitstatus}")
    end
    return (joinStderr ? (stderr+stdout) : stdout).strip
  end

  #################################################################################################
  def call(javaClass, args, joinStderr = false)
    startInternal
    begin
      retries ||= 0
      callInternal(false, joinStderr, ([javaClass] + args).join(" "))
    rescue Exception => e
      # We've been getting a mysterious "code 227" error sometimes from Nailgun. Restart and retry
      # appears to fix it.
      if e.to_s =~ /code 227/ && (retries += 1) <= 3
        puts "Exception, will retry: #{e}"
        stopInternal
        sleep 1
        startInternal
        sleep 5
        retry
      end
      raise
    end
  end

  #################################################################################################
  def restart
    stopInternal
    startInternal
  end
end