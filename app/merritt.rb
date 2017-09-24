# Classes for fetching files from Merritt, and synchronizing those fetches.

###################################################################################################
class MerrittFetcher
  attr_reader :url, :putInFileCache, :bytesFetched, :status, :mrtFile, :waitingThreads

  def initialize(url, putInFileCache)
    # We have to fetch the file in a different thread, because it needs to keep the HTTP request
    # open in that thread while we return the status code to Sinatra. Then the remaining data can
    # be streamed from the thread to Sinatra.
    puts "Merritt fetch: #{url}."
    @url = url
    @putInFileCache = putInFileCache
    @queue = QueueWithTimeout.new
    @status = "starting"
    @startTime = Time.now
    @mrtFile = nil
    @length = nil
    @bytesFetched = 0
    @waitingThreads = Set.new   # used externally to this class, but stored here for their convenience
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
    while true
      data = @queue.pop_with_timeout(10)
      data == 0 and next  # ignore initial status=ok message
      data.is_a?(Exception) and raise(data)  # pass exceptions on to main thread
      data.nil? and break
      data.length > 0 and out << data
    end
  end

  private
  def fetchInternal()
    mrtTmp = nil
    begin
      mrtTmp = @putInFileCache ? Tempfile.open("mrt_", TEMP_DIR) : nil
      uri = URI(@url)
      Net::HTTP.start(uri.host, uri.port, :use_ssl => (uri.scheme == 'https')) do |http|
        req = Net::HTTP::Get.new(uri.request_uri)
        req.basic_auth $mrtExpressConfig['username'], $mrtExpressConfig['password']
        startTime = Time.now
        http.request(req) do |resp|
          resp.code == "200" or raise("Response to #{@url} was HTTP #{resp.code}: #{resp.message}")
          @status = "fetching"
          @length = resp["Expected-Content-Length"].to_i
          @queue << 0
          resp.read_body { |chunk|
            @bytesFetched += chunk.length
            if @putInFileCache
              mrtTmp.write(chunk)
            else
              @queue << chunk
            end
          }
        end
        @endTime = Time.now
      end
      @putInFileCache and @mrtFile = $fileCache.take(@url, mrtTmp)
      @status = "done"
      @queue << nil  # mark end-of-data
    rescue Exception => e
      puts "Merritt fetch exception: #{e}"
      @status = e
      @queue << e
      if mrtTmp
        mrtTmp.close
        mrtTmp.unlink
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

  private
  def watch
    loop do
      sleep 2
      begin
        @mutex.synchronize {
          if !@fetching.empty?
            puts
            fmt = "%-8s %-5s %6s %6s %10s %6s %5s %s"
            puts sprintf(fmt, "Status", "cache", "time", "pct", "length", "rate", "thrds", "URL")
            @fetching.each { |url, fetcher|
              puts sprintf(fmt, fetcher.status, fetcher.putInFileCache,
                                sprintf("%d:%02d", (fetcher.elapsed/60).to_i, fetcher.elapsed % 60),
                                sprintf("%5.1f%%", (fetcher.bytesFetched * 100.0 / fetcher.length)),
                                fetcher.length,
                                sprintf("%5.1fM", fetcher.bytesFetched / (fetcher.elapsed + 0.01) / (1024*1024)),
                                fetcher.waitingThreads.size,
                                url.sub("express.cdlib.org/dl/ark:/13030", "..."))
            }
            puts
          end
        }
      rescue Exception => e
        puts "Watcher exception: #{e} #{e.backtrace}"
      end
    end
  end
end