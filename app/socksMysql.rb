# Proxy for Mysql through SOCKS

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

###################################################################################################
# External gems we need
require 'socket'

###################################################################################################
class SocksMysql

  #################################################################################################
  def initialize(dbConfig)
    @host = dbConfig['host']
    @port = dbConfig['port']
    timestamp = Time.now.to_f
    @sockName = ".mysqlpsk.#{@port}.#{Process.getpgrp}.#{timestamp}"

    # Blow away obsolete sockets from prior runs
    Dir.glob(".mysqlpsk.#{@port}.*").each { |fn|
      fn =~ /\.mysqlpsk\.\d+\.(\d+)/
      next if Process.getpgrp == $1.to_i
      puts "Deleting obsolete #{fn}."
      File.delete(fn)
    }

    # Fire up a thread to create and service the Unix socket we'll use to proxy MySQL traffic
    ready = Queue.new
    Thread.new { self.service(ready) }
    ready.pop  # wait for thread to become ready

    # Reconfigure MySQL to connect through our socket
    dbConfig.delete 'host'
    dbConfig.delete 'port'
    dbConfig['socket'] = @sockName
  end

  #################################################################################################
  def service(ready)
    Socket.unix_server_socket(@sockName) { |server|
      ready << true
      Socket.accept_loop(server) { |localSock, _client_addrinfo|
        # Serve each in a new thread, since Sequel might start multiple connections
        Thread.new {
          begin
            TCPSocket.open(@host, @port) { |remoteSock|
              bidiTransfer(localSock, remoteSock)
            }
          rescue Exception => e
            puts "Proxy communication exception: #{e.inspect}.\n\t#{e.backtrace.join("\n\t")}"
          end
        }
      }
    }
  rescue Exception => e
    puts "Proxy communication exception: #{e.inspect}.\n\t#{e.backtrace.join("\n\t")}"
  end

  #################################################################################################
  def bidiTransfer(localSock, remoteSock)
    while true
      rds, wrs, ers = IO.select([localSock, remoteSock], [])
      rds.each { |r|
        data = r.recv(8192)
        data.empty? and return
        #puts "Tranferring data from #{r == localSock ? "local" : r == remoteSock ? "remote" : r}: #{data.inspect}"
        (r == remoteSock ? localSock : remoteSock).write(data)
      }
    end
  rescue Exception => e
    puts "Proxy communication exception: #{e.inspect}.\n\t#{e.backtrace.join("\n\t")}"
  end

end
