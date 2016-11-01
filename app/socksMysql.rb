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
  def self.setup(dbConfig)
    Thread.abort_on_exception = true
    
    TCPSocket::socks_server = "127.0.0.1"
    TCPSocket::socks_port = dbConfig['socks_port']
    
    host = dbConfig['host']
    dbConfig.delete 'host'
    port = dbConfig['port']
    dbConfig.delete 'port'

    dbConfig['socket'] = ".mysqlProxySock"

    ready = Queue.new
    Thread.new { service(host, port, ready) }
    ready.pop  # wait for thread to become ready
  end

  #################################################################################################
  def self.service(host, port, ready)
    File.exist?(".mysqlProxySock") and File.delete(".mysqlProxySock")
    Socket.unix_server_socket(".mysqlProxySock") { |server|
      ready << true
      Socket.accept_loop(server) { |localSock, client_addrinfo|
        remoteSock = TCPSocket.open(host, port)
        begin
          bidiTransfer(localSock, remoteSock)
        rescue Exception => e
          puts "Proxy communication exception: #{e.inspect}.\n\t#{e.backtrace.join("\n\t")}"
        ensure
          localSock.close
          remoteSock.close
        end
      }
    }
  ensure
    File.exist?(".mysqlProxySock") and File.delete(".mysqlProxySock")
  end

  #################################################################################################
  def self.bidiTransfer(localSock, remoteSock)
    done = false
    while !done
      rds, wrs, ers = IO.select([localSock, remoteSock], [])
      ers.each { |e| raise "Exception pending on: #{e}" }
      rds.each { |r|
        if r == localSock
          data = localSock.recv(8192)
          done ||= data.empty?
          remoteSock.write(data)
        elsif r == remoteSock
          data = remoteSock.recv(8192)
          done ||= data.empty?
          localSock.write(data)
        end
      }
    end
  end

end
