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
    first = true
    while true
      rds, wrs, ers = IO.select([localSock, remoteSock], [])
      rds.each { |r|
        data = r.recv(8192)
        data.empty? and return
        if first
          # Kludge alert! I can't figure out why, but sometimes we miss the first four bytes of the
          # server's initial response. A correct response seems to always start with these, so add
          # them back in.
          # WARNING: this sequence is specific to the version of MySQL you are using...
          # and will likely change after any major upgrade of MySQL

          !data.start_with? "I\x00\x00\x00" and data = "I\x00\x00\x00" + data
          # puts "Tranferring data from #{r == localSock ? "local" : r == remoteSock ? "remote" : r}: #{data.inspect}"
          first = false
        end



        # puts "Tranferring data from #{r == localSock ? "local" : r == remoteSock ? "remote" : r}: #{data.inspect}"
        (r == remoteSock ? localSock : remoteSock).write(data)
      }
    end
  rescue Exception => e
    puts "Proxy communication exception: #{e.inspect}.\n\t#{e.backtrace.join("\n\t")}"
  end

end
