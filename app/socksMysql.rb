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
  def self.reconfigure(dbConfig)
    # Fire up a thread to create and service the Unix socket we'll use to proxy MySQL traffic
    ready = Queue.new
    timestamp = Time.now.to_f
    Thread.new { SocksMysql.new.service(dbConfig['host'], dbConfig['port'], timestamp, ready) }
    ready.pop  # wait for thread to become ready

    # Reconfigure MySQL to connect through our socket
    dbConfig.delete 'host'
    dbConfig.delete 'port'
    dbConfig['socket'] = ".mysqlProxySock.#{timestamp}"
  end

  #################################################################################################
  def service(host, port, timestamp, ready)
    Dir.glob(".mysqlProxySock.*").each { |fn| 
      puts "Deleting obsolete #{fn}."
      File.delete(fn)
    }
    Socket.unix_server_socket(".mysqlProxySock.#{timestamp}") { |server|
      ready << true
      Socket.accept_loop(server) { |localSock, client_addrinfo|
        # Serve each in a new thread, since Sequel might start multiple connections
        Thread.new(TCPSocket.open(host, port)) { |remoteSock| bidiTransfer(localSock, remoteSock) }
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
        (r == remoteSock ? localSock : remoteSock).write(data)
      }
    end
  rescue Exception => e
    puts "Proxy communication exception: #{e.inspect}.\n\t#{e.backtrace.join("\n\t")}"
  ensure
    localSock.close
    remoteSock.close
  end

end
