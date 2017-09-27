# Classes for fetching files from Merritt, and synchronizing those fetches.

###################################################################################################
class MerrittFetcher
  attr_reader :url, :bytesFetched, :status, :mrtFile, :waitingThreads

  @@allFetchers = Set.new
  @@newFetchers = Queue.new
  @@doneFetchers = Queue.new
  @@watchThread = Thread.new { self.watch }

  def initialize(url, fifoPath = nil)
    # We have to fetch the file in a different thread, because it needs to keep the HTTP request
    # open in that thread while we return the status code to Sinatra. Then the remaining data can
    # be streamed from the thread to Sinatra.
    puts "Merritt fetch: #{url}."
    @url = url
    @fifoPath = fifoPath
    @queue = QueueWithTimeout.new
    @status = "starting"
    @startTime = Time.now
    @mrtFile = nil
    @length = nil
    @bytesFetched = 0
    @stop = false
    @waitingThreads = Set.new   # used externally to this class, but stored here for their convenience
    @@newFetchers << self
    Thread.new { fetchInternal() }
  end

  def length
    if @status == "starting"
      # Wait for the fetch thread to get the headers
      resp = @queue.pop_with_timeout(60)
      resp.is_a?(Exception) and raise(resp)
    end
    @length
  end

  def elapsed
    Time.now - @startTime
  end

  def streamTo(out)
    !@putInFileCache or raise("can't stream out if putInFileCache was set")
    begin
      out.respond_to?(:callback) and out.callback { @stop = true }
      while !@stop
        data = @queue.pop_with_timeout(10)
        data == 0 and next  # ignore initial status=ok message
        data.is_a?(Exception) and raise(data)  # pass exceptions on to main thread
        data.nil? and break
        data.length > 0 and out << data
      end
      out.respond_to?(:close) and out.close
    rescue Exception => e
      if e.to_s =~ /closed stream/
        # already logged elsewhere
      else
        puts "Unexpected streamTo exception: #{e} #{e.backtrace}"
      end
    end
  end

  private
  def fetchInternal()
    begin
      uri = URI(@url)
      fifo = nil
      Net::HTTP.start(uri.host, uri.port, :use_ssl => (uri.scheme == 'https')) do |http|
        req = Net::HTTP::Get.new(uri.request_uri)
        req.basic_auth $mrtExpressConfig['username'], $mrtExpressConfig['password']
        startTime = Time.now
        http.request(req) do |resp|
          resp.code == "200" or raise("Response to #{@url} was HTTP #{resp.code}: #{resp.message}")
          @status = "fetching"
          @length = resp["Expected-Content-Length"].to_i
          @queue << 0
          fifo = @fifoPath ? File.open(@fifoPath, "wb") : nil
          resp.read_body { |chunk|
            @stop and http.finish
            @bytesFetched += chunk.length
            fifo ? fifo.write(chunk) : @queue.push(chunk)
          }
        end
        @endTime = Time.now
      end
      puts "Merritt fetch complete: #{@url}"
      @status = "done"
      @queue << nil  # mark end-of-data
    rescue Exception => e
      if e.to_s =~ /closed stream/
        puts "Merritt stream closed early for url #{url}."
      else
        puts "Merritt fetch exception: #{e} for url #{@url}. #{e.backtrace}"
      end
      @status = e
      @queue << e
    ensure
      @@doneFetchers << self
      fifo and fifo.close
    end
  end

  def self.watch
    loop do
      sleep 2
      begin
        while !@@newFetchers.empty?
          @@allFetchers << @@newFetchers.pop
        end
        while !@@doneFetchers.empty?
          @@allFetchers.delete @@doneFetchers.pop
        end
        if !@@allFetchers.empty?
          puts
          fmt = "%-8s %6s %6s %10s %6s %5s %s"
          puts sprintf(fmt, "Status", "time", "pct", "length", "rate", "thrds", "URL")
          @@allFetchers.each { |fetcher|
            puts sprintf(fmt, fetcher.status,
                              sprintf("%d:%02d", (fetcher.elapsed/60).to_i, fetcher.elapsed % 60),
                              sprintf("%5.1f%%", (fetcher.bytesFetched * 100.0 / fetcher.length)),
                              fetcher.length,
                              sprintf("%5.1fM", fetcher.bytesFetched / (fetcher.elapsed + 0.01) / (1024*1024)),
                              fetcher.waitingThreads.size,
                              fetcher.url.sub("express.cdlib.org/dl/ark:/13030", "..."))
          }
          puts
        end
      rescue Exception => e
        puts "Merritt watcher exception: #{e} #{e.backtrace}"
      end
    end
  end
end

###################################################################################################
class MerrittCache
  def initialize
    @mutex = Mutex.new
    @fetching = {}
    Thread.new { watch }
  end

  def fetch(mrtURL)
    # If already cached, just return the file
    mrtFile = $fileCache.find(mrtURL) and return mrtFile

    # If not yet fetching this, fire up a thread to do so. In either case, get on the
    # list of threads waiting for the fetch.
    @mutex.synchronize {
      @fetching.include?(mrtURL) or @fetching[mrtURL] = MerrittFetcher.new(mrtURL, true)
      @fetching[mrtURL].waitingThreads << Thread.current
    }

    # Wait for the fetcher to complete (successfully or otherwise)
    loop do
      sleep 0.2   # yeah, polling isn't that efficient, but it is super easy and good enough.
      @mutex.synchronize {
        status = @fetching[mrtURL].status
        if status == "starting" || status == "fetching"
          # keep waiting
        elsif status.is_a?(Exception)
          raise(status)
        elsif status == "done"
          mrtFile = @fetching[mrtURL].mrtFile
          @fetching[mrtURL].waitingThreads.delete(Thread.current).empty? and @fetching.delete(mrtURL)
          return mrtFile
        else
          raise("unrecognized status #{status.inspect}")
        end
      }
    end
  end
end