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

    # Strange this is a global in Ruby. But still we want it.
    Thread.abort_on_exception = true

    # Configure socksify with the right port. Now all TCP connections will go through it.
    TCPSocket::socks_server = "127.0.0.1"
    TCPSocket::socks_port = dbConfig['socks_port']

    # Fire up a thread to create and service the Unix socket we'll use to proxy MySQL traffic
    ready = Queue.new
    Thread.new { SocksMysql.new.service(dbConfig['host'], dbConfig['port'], ready) }
    ready.pop  # wait for thread to become ready

    # Reconfigure MySQL to connect through our socket
    dbConfig.delete 'host'
    dbConfig.delete 'port'
    dbConfig['socket'] = ".mysqlProxySock"
  end

  #################################################################################################
  def service(host, port, ready)
    File.exist?(".mysqlProxySock") and File.delete(".mysqlProxySock")
    Socket.unix_server_socket(".mysqlProxySock") { |server|
      ready << true
      Socket.accept_loop(server) { |localSock, client_addrinfo|
        # Serve each in a new thread, since Sequel might start multiple connections
        Thread.new(TCPSocket.open(host, port)) { |remoteSock| bidiTransfer(localSock, remoteSock) }
      }
    }
  rescue Exception => e
    puts "Proxy communication exception: #{e.inspect}.\n\t#{e.backtrace.join("\n\t")}"
  ensure
    File.exist?(".mysqlProxySock") and File.delete(".mysqlProxySock")
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
