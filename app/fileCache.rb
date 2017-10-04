##############################################################################
# Methods for maintaining a disk-based cache of files we download from
# Merritt, S3, and the splash page generator.

require 'cgi'
require 'time'

FILECACHE_MAX_ENTRIES = 100
FILECACHE_MAX_SIZE = 100*1024*1024  # 50 megabytes
FILECACHE_MAX_AGE = 5*60 # 5 minutes

class FileCache
  def initialize(cachePath)
    @cachePath = cachePath
    FileUtils.mkdir_p(@cachePath)
    @mutex = Mutex.new
    @mutex.synchronize { _clean }
  end

  def _urlToFilename(url)
    return CGI.escape(url)
  end

  def take(srcURL, tmpFile)
    @mutex.synchronize {
      tmpFile.close
      target = "#{@cachePath}/#{_urlToFilename(srcURL)}"
      File.exist?(target) and File.delete(target)
      File.rename(tmpFile.path, target)
      _clean
      return target
    }
  end

  def find(srcURL)
    @mutex.synchronize {
      _clean
      target = "#{@cachePath}/#{_urlToFilename(srcURL)}"
      File.exist?(target) and return target
      return nil
    }
  end

  def _clean
    # Clean every 30 seconds or so
    return if !@lastClean.nil? && (Time.now - @lastClean) < 30

    # Only clean in the first worker process
    return if $workerNum > 0

    # Scan the cache directory for all the entries
    now = Time.now
    totalSize = 0
    entries = Dir.entries(@cachePath).map { |file|
      next if file =~ /^\./
      path = "#{@cachePath}/#{file}"
      size = File.size(path)
      totalSize += size
      { path: path, size: size, age: now - File.mtime(path) }
    }.reject { |e| e.nil? }

    # Delete oldest entries until we're within all limits.
    nEntries = entries.length
    entries.sort { |a,b| a[:age] <=> b[:age] }.each { |ent|
      if nEntries > FILECACHE_MAX_ENTRIES || totalSize > FILECACHE_MAX_SIZE || ent[:age] > FILECACHE_MAX_AGE
        File.delete(ent[:path])
        nEntries -= 1
        totalSize -= ent[:size]
      end
    }

    # Record the time so we can put off cleaning for a while.
    @lastClean = now
  end
end