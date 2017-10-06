# Classes for fetching files from Merritt, and synchronizing those fetches.

###################################################################################################
class Fetcher
  attr_reader :url, :bytesFetched, :status, :waitingThreads

  @@allFetchers = Set.new
  @@fetcherMutex = Mutex.new
  @@watchThread = nil

  def initialize(url)
    # We have to fetch the file in a different thread, because it needs to keep the HTTP request
    # open in that thread while we return the status code to Rack. Then the remaining data can
    # be streamed from the thread to Rack.
    @url = url
    @queue = QueueWithTimeout.new
    @status = "starting"
    @lengthReady = Event.new
    @startTime = Time.now
    @length = 0
    @bytesFetched = 0
    @stop = false
    @waitingThreads = Set.new
    @@fetcherMutex.synchronize {
      @@allFetchers << self
      @@watchThread.nil? and @@watchThread = Thread.new { Fetcher.watch }
    }
    @startTime = Time.now
    fetchInThread()
  end

  def length
    begin
      @waitingThreads << Thread.current
      @lengthReady.wait
    ensure
      @waitingThreads.delete(Thread.current)
    end
    return @length
  end

  def elapsed
    if @endTime
      return @endTime - @startTime
    else
      return Time.now - @startTime
    end
  end

  def streamTo(out)
    begin
      @waitingThreads << Thread.current
      out.respond_to?(:callback) and out.callback { @stop = true }
      while !@stop
        data = @queue.pop_with_timeout(10)
        data == 0 and next  # ignore initial status=ok message
        data.is_a?(Exception) and raise(data)  # pass exceptions on to main thread
        data.nil? and break
        data.length > 0 and out << data
      end
      out.respond_to?(:close) and out.close
      return @bytesFetched
    rescue Exception => e
      @lengthReady.set  # just in case somebody's waiting for it
      @stop = true
      if e.to_s =~ /closed stream|Socket timeout writing data/
        # already logged elsewhere
      else
        puts "Unexpected streamTo exception: #{e} #{e.backtrace}"
      end
    ensure
      @waitingThreads.delete(Thread.current)
    end
  end

  def gotLength(len)
    @length = len
    @lengthReady.set
  end

  def gotChunk(chunk)
    @stop and raise("stopped")
    @bytesFetched += chunk.length
    @queue.push(chunk)
  end

  private
  def fetchInThread()
    Thread.new {
      begin
        @status = "fetching"
        fetchInternal()
        @endTime = Time.now
        puts "Fetch complete: #{@url}"
        @status = "done"
        @queue << nil  # mark end-of-data
      rescue Exception => e
        if e.to_s =~ /^stopped|closed stream|Socket timeout writing data/
          puts "Stream closed early for url #{url}."
        else
          puts "Fetch exception: #{e} for url #{@url}. #{e.backtrace}"
        end
        @status = e
        @queue << e
      ensure
        @lengthReady.set  # in case anybody's waiting on it and it didn't get set
      end
    }
  end

  def self.watch
    begin
      stop = false
      while !stop
        sleep 1
        buf = []
        doneFetchers = Set.new
        @@fetcherMutex.synchronize {
          fmt = "%-8s %6s %6s %10s %6s %5s %s"
          @@allFetchers.each { |fetcher|
            if fetcher.elapsed > 1
              buf.empty? and buf << sprintf(fmt, "Status", "time", "pct", "length", "rate", "thrds", "URL")
              buf << sprintf(fmt, fetcher.status.is_a?(Exception) ? "error" : fetcher.status,
                             sprintf("%d:%02d", (fetcher.elapsed/60).to_i, fetcher.elapsed % 60),
                             sprintf("%5.1f%%", (fetcher.bytesFetched * 100.0 / fetcher.length)),
                             fetcher.length,
                             sprintf("%5.1fM", fetcher.bytesFetched / (fetcher.elapsed + 0.01) / (1024*1024)),
                             fetcher.waitingThreads.size,
                             fetcher.url.sub("express.cdlib.org/dl/ark:/13030", "..."))
            end
            if fetcher.waitingThreads.empty? && !%w{starting fetching}.include?(fetcher.status)
              doneFetchers << fetcher
            end
          }
          @@allFetchers -= doneFetchers
          @@allFetchers.empty? and stop = true
        }
        buf.each { |s| puts s }  # do this outside mutex, just because scared of deadlocks in puts
      end
    rescue Exception => e
      puts "Fetcher.watch exception: #{e} #{e.backtrace}"
    ensure
      @@fetcherMutex.synchronize { @@watchThread = nil }
    end
  end
end

###################################################################################################
class MerrittFetcher < Fetcher
  def fetchInternal
    uri = URI(@url)
    Net::HTTP.start(uri.host, uri.port, :use_ssl => (uri.scheme == 'https')) do |http|
      req = Net::HTTP::Get.new(uri.request_uri)
      req.basic_auth $mrtExpressConfig['username'], $mrtExpressConfig['password']
      http.request(req) do |resp|
        resp.code == "200" or raise("Response to #{@url} was HTTP #{resp.code}: #{resp.message}")
        gotLength(resp["Expected-Content-Length"].to_i)
        resp.read_body { |chunk|
          @stop and http.finish
          gotChunk(chunk)
        }
      end
    end
  end
end

###################################################################################################
class S3Fetcher < Fetcher
  class S3Passer
    def initialize(fetcher)
      @fetcher = fetcher
    end
    def write(chunk)
      @fetcher.gotChunk(chunk)
    end
    def close()
      # no need for anything
    end
  end

  def initialize(s3Obj, s3Path, range = nil)
    @s3Obj = s3Obj
    @s3Path = s3Path
    @range = range
    super("s3:#{s3Path}")
  end

  def fetchInternal
    gotLength(@s3Obj.content_length)
    @s3Obj.get(response_target: S3Passer.new(self), range: @range)
  end
end
