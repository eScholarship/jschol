# Server-side application for eschol5 - see README.md for more info

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

###################################################################################################
# External gems we need
require 'aws-sdk-s3'
require 'cgi'
require 'digest'
require 'httparty'
require 'json'
require 'logger'
require 'mimemagic'
require 'open-uri'
require 'pp'
require 'sequel'
require 'sinatra'
require 'tempfile'
require 'socksify'
require 'socket'
require 'uri'

# On dev and stg we control access with a special cookie
ACCESS_COOKIE = (ENV['ACCESS_COOKIE'] || '').empty? ? nil : ENV['ACCESS_COOKIE']

# Make puts thread-safe, and flush after every puts.
$stdoutMutex = Mutex.new
$workerNum = 0
$workerPrefix = ""
$nextThreadNum = 0
def puts(str)
  $stdoutMutex.synchronize {
    if !Thread.current[:number]
      allNums = Set.new
      Thread.list.each { |t| allNums << t[:number] }
      num = 0
      while allNums.include?(num)
        num += 1
      end
      Thread.current[:number] = num
    end
    STDOUT.puts "[#{$workerPrefix}#{Thread.current[:number]}] #{str}"
    STDOUT.flush
  }
end

# Make it clear where the new session starts in the log file.
STDOUT.write "\n=====================================================================================\n"

def waitForSocks(host, port)
  begin
    sock = TCPSocket.new(host, port)
    sock.close
  rescue Errno::ECONNREFUSED
    retries ||= 0
    retries == 0 and puts("Waiting for SOCKS proxy to start.")
    retries += 1
    if retries == 60 # == 30 sec
      puts "SOCKS proxy failed. Verify that 'ssh yourUsername@pub-submit2-dev.escholarship.org' works."
      exit 1
    else
      sleep 0.5
      retry
    end
  end
end

def getEnv(name)
  return ENV[name] || raise("missing env #{name}")
end

def ensureConnect(envPrefix)
  Sequel.default_timezone=:local
  dbConfig = { "adapter"  => "mysql2",
               "host"     => getEnv("#{envPrefix}_HOST"),
               "port"     => getEnv("#{envPrefix}_PORT").to_i,
               "database" => getEnv("#{envPrefix}_DATABASE"),
               "username" => getEnv("#{envPrefix}_USERNAME"),
               "password" => getEnv("#{envPrefix}_PASSWORD") }
  if ENV['USE_SOCKS_FOR_MYSQL'].to_s.downcase == 'true'
    if TCPSocket::socks_port
      SocksMysql.new(dbConfig)
    end
  end
  db = Sequel.connect(dbConfig)
  n = db.fetch("SHOW TABLE STATUS").all.length
  n > 0 or raise("Failed to connect to db.")
  return db
end

# Use the Sequel gem to get object-relational mapping, connection pooling, thread safety, etc.
# If specified, use SOCKS proxy for all connections (including database).
if ENV['SOCKS_PORT']
  # Configure socksify for all TCP connections. Jump through hoops for MySQL to use it too.
  socksPort = ENV['SOCKS_PORT']
  waitForSocks("127.0.0.1", socksPort)
  TCPSocket::socks_server = "127.0.0.1"
  TCPSocket::socks_port = socksPort
  #Only use the socksMysql code if USE_SOCKS_FOR_MYSQL is true
  if ENV['USE_SOCKS_FOR_MYSQL'].to_s.downcase == 'true'
    require_relative 'socksMysql'
  end
end
puts "Connecting to eschol DB.    "
DB = ensureConnect("ESCHOL_DB")
#DB.loggers << Logger.new('server.sql_log')  # Enable to debug SQL queries on main db
puts "Connecting to OJS DB.       "
OJS_DB = ensureConnect("OJS_DB")
#OJS_DB.loggers << Logger.new('ojs.sql_log')  # Enable to debug SQL queries on OJS db

# When fetching ISO pages from the local server, we need the host name.
$host = ENV['HOST'] ? "#{ENV['HOST']}.escholarship.org" : "localhost"

# Used when fetching RSS data from the API server
$escholApiServer = getEnv("ESCHOL_API_SERVER")

# Uncomment for memory leak debugging
  # puts "Will trace object allocations; send signal USR1 to write heap.dump.gz"
  # require 'objspace'
  # ObjectSpace.trace_object_allocations_start
  # Signal.trap("USR1") {
  #   Thread.new {
  #     puts "Dumping heap to 'heap.dump'."
  #     File.open('heap.dump', "w") { |io|
  #       ObjectSpace.dump_all(output: io)
  #     }
  #     puts "Heap dump complete."
  #   }
  # }


# Need a key for encrypting login credentials and URL keys
$jscholKey = ENV['JSCHOL_KEY'] or raise("missing env JSCHOL_KEY")

# S3 API client
puts "Connecting to S3.           "
S3_LOGGING = false
if S3_LOGGING
  # Temporary wire logging while we diagnose S3 timeouts with the AWS folks.
  # It's so verbose that it even dumps binary data; to keep the log size at all
  # reasonable, omit that part.
  class S3Logger < Logger
    @prevWasOmitted = false
    def << (msg)
      if msg =~ /\\r\\n/ && !(msg =~ /\\x/)
        puts "s3: #{msg}"
        @prevWasOmitted = false
      else
        if !@prevWasOmitted
          puts "s3: [data omitted]"
        end
        @prevWasOmitted = true
      end
    end
  end
  s3Logger = S3Logger.new(STDOUT)
  $s3Client = Aws::S3::Client.new(region: getEnv("S3_REGION"),
                                  :logger => s3Logger, :http_wire_trace => true)
else
  $s3Client = Aws::S3::Client.new(region: getEnv("S3_REGION"))
end
$s3Bucket = Aws::S3::Bucket.new(getEnv("S3_BUCKET"), client: $s3Client)

# Internal modules to implement specific pages and functionality
require_relative '../util/sanitize.rb'
require_relative '../util/xmlutil.rb'
require_relative '../util/event.rb'
require_relative 'hierarchy'
require_relative 'listViews'
require_relative 'searchApi'
require_relative 'queueWithTimeout'
require_relative 'statsPages'
require_relative 'unitPages'
require_relative 'citation'
require_relative 'loginApi'
require_relative 'redirect'
require_relative 'sitemap'

class StdoutLogger
  def << (str)
    puts(str)
  end
end

$stdoutLogger = StdoutLogger.new

# Replace Rack's CommonLogger with a slight modification to log Referer and X-Amzn-Trace-Id
class AccessLogger

  FORMAT = %{%s - %s [%s] "%s %s%s %s" %d %s %0.4f %s %s\n}

  def initialize(app, logger=nil)
    @app = app
    @logger = logger
  end

  def call(env)
    began_at = Rack::Utils.clock_time
    status, header, body = @app.call(env)
    header = Rack::Utils::HeaderHash.new(header)
    body = Rack::BodyProxy.new(body) { log(env, status, header, began_at) }
    [status, header, body]
  end

  private

  def log(env, status, header, began_at)
    length = extract_content_length(header)

    msg = FORMAT % [
      env['HTTP_X_FORWARDED_FOR'] || env["REMOTE_ADDR"] || "-",
      env["REMOTE_USER"] || "-",
      Time.now.strftime("%d/%b/%Y:%H:%M:%S %z"),
      env[Rack::REQUEST_METHOD],
      env[Rack::PATH_INFO],
      env[Rack::QUERY_STRING].empty? ? "" : "?#{env[Rack::QUERY_STRING]}",
      env[Rack::HTTP_VERSION],
      status.to_s[0..3],
      length,
      Rack::Utils.clock_time - began_at,
      extract_referer(env, header),  # added
      extract_trace(env, header) ]   # added

    logger = @logger || env[Rack::RACK_ERRORS]
    # Standard library logger doesn't support write but it supports << which actually
    # calls to write on the log device without formatting
    if logger.respond_to?(:write)
      logger.write(msg)
    else
      logger << msg
    end
  end

  def extract_content_length(headers)
    value = headers[Rack::CONTENT_LENGTH] or return '-'
    value.to_s == '0' ? '-' : value
  end

  def extract_referer(env, headers)
    value = env['HTTP_REFERER'] || headers['REFERER'] or return '-'
    return quote(value)
  end

  def extract_trace(env, headers)
    value = env['HTTP_X_AMZN_TRACE_ID'] || headers['X-AMZN-TRACE-ID'] or return '-'
    return quote(value)
  end

  def quote(value)
    return "\"#{value.gsub("\"", "%22").gsub(/\s/, "+")}\""
  end
end

###################################################################################################
# Model classes for easy interaction with the database.
#
# For more info on the database schema, see contents of migrations/ directory, and for a more
# graphical version, see:
#
# https://docs.google.com/drawings/d/1gCi8l7qteyy06nR5Ol2vCknh9Juo-0j91VGGyeWbXqI/edit
puts "Populating db models."
require_relative '../tools/models.rb'

# DbCache uses the models above.
require_relative 'dbCache'
fillCaches

# Sinatra configuration
configure do
  # Puma is good for multiprocess *and* multithreading
  set :server, 'puma'

  # Sinatra unfortunately serves static files before running the 'before' block, preventing
  # us from doing redirects on static files.
  set :static, false

  set :show_exceptions, false

  # Replace Sinatra's normal logging with one that goes to our overridden stdout puts, so we
  # can include the pid and thread number with each request.
  set :logging, false
  use AccessLogger, $stdoutLogger

   # Compress things that can benefit
  use Rack::Deflater,
    :include => %w{application/javascript application/xml text/html text/css application/json image/svg+xml},
    :if => lambda { |_env, _status, headers, _body|
      # advice from https://www.itworld.com/article/2693941/cloud-computing/
      #               why-it-doesn-t-make-sense-to-gzip-all-content-from-your-web-server.html
      return headers["Content-Length"].to_i > 1400
    }
end

TEMP_DIR = "tmp"
FileUtils.mkdir_p(TEMP_DIR)

###################################################################################################
# ISOMORPHIC JAVASCRIPT
# =====================
#
# Using a Javascript front-end framework like React has a couple downsides: First, it makes the
# site unusable by users who have Javascript turned off. Second, not all crawlers can or do run
# your javascript, and so it might make the site invisible to them.
#
# The solution is so-called "isomorphic Javascript". Basically we run React not only in the
# browser but also on the server. When the page initially loads, we generate the initial HTML
# that React will eventually generate once it fully initializes on the client side, and we send
# that HTML as a starting point. When React starts up on the client, it verifies that the HTML
# is the same (and issues a console warning if not).
#
# How do we run React on the server? We keep a little Node Express server running on a differnet
# port than the main app, and when we need to load a page we feed it the initial data, it runs
# the appropriate React templates, and returns us the HTML.
#
# In this way, the user gets a speedy initial load and can use some of the site features without
# javascript, and crawlers have an easy time seeing everything the users see.
###################################################################################################

###################################################################################################
# Redirect processing, access control, cache control, etc.
before do

  # On dev and stg, control access with a special cookie
  if ACCESS_COOKIE
    if request.params['access']
      response.set_cookie(:ACCESS_COOKIE, :value => request.params['access'], :path => "/")
      ACCESS_COOKIE == request.params['access'] or halt(401, "Not authorized.")
    elsif request.path != "/check"
      ACCESS_COOKIE == request.cookies['ACCESS_COOKIE'] or halt(401, "Not authorized.")
    end
  end

  # Check the long list of things to redirect
  redirURI, code = checkRedirect(URI.parse(request.url))
  if code
    if code >= 300 && code <= 399
      redirect to(redirURI.to_s, code), code
    else
      halt code
    end
  end

  # Most of the responses from this app are dynamic and shouldn't be cached (e.g. unit pages,
  # pageData responses, etc.) The exceptions, e.g. assets, explicitly override cache_control.
  cache_control :no_store

  # Emulate Sinatra's handling of static files, *after* all our access and redirect checks
  path = File.expand_path("app/#{CGI::unescape(request.path_info)}")
  if File.file?(path)
    env['sinatra.static_file'] = path
    cache_control(:public, :max_age => 3600)
    send_file path, :disposition => nil
  end
end

###################################################################################################
# Simple up-ness check
get "/check" do
  if ENV['ISO_PORT']
    response = HTTParty.get("http://#{$host}:#{ENV['ISO_PORT']}/check", :timeout => 20)
    response.code == 200 or halt(500, "ISO server not ok.")
  end
  return "ok"
end

###################################################################################################
# Permissive robots.txt on production; restrictive elsewhere.
get "/robots.txt" do
  content_type "text/plain"
  lines = ["User-agent: Amazonbot",
           "Disallow: /",
           "",
           "User-agent: *",
           "Disallow:#{request.host == "escholarship.org" ? "" : " /"}",
           "",
           "User-agent: *",
           "Crawl-delay: 3",
           "",
           "Sitemap: #{request.env['HTTP_CLOUDFRONT_FORWARDED_PROTO'] || request.scheme}://#{request.host}/siteMapIndex.xml"]
  return lines.join("\n")
end

###################################################################################################
def proxyFromURL(url, _overrideHostname = nil)
  response = HTTParty.get(url)
  response.code == 200 or halt(response.code)
  response.headers['content-type'] and headers("Content-Type" => response.headers['content-type'])
  return response.body
end

###################################################################################################
# Old XTF-style "smode" searches fall to here; all other old searches get redirected.
get %r{/uc/search(.*)} do |_stuff|
  request.url =~ %r{/uc/search(.*)}
  proxyFromURL("https://submit.escholarship.org/uc/search#{$1}", "escholarship.org")
end

###################################################################################################
# Directory used by RePec to crawl our site
get %r{/repec(.*)} do
  request.url =~ %r{/repec(.*)}
  proxyFromURL("https://submit.escholarship.org/repec#{$1}", "escholarship.org")
end

###################################################################################################
# Sanitize incoming filenames before applying them to the filesystem. In particular, prevent
# attacks using "../" as part of the path.
def sanitizeFilePath(path)
  path = path.gsub(/[^-a-z A-Z0-9_.\/]/, '_').split("/").map { |part|
    part.sub(/^\.+/, '_').sub(/\.+$/, '_')
  }.join('/')
end

###################################################################################################
get %r{/cms-assets/([0-9a-f]{64})} do |hash|
  s3Path = "#{getEnv("S3_BINARIES_PREFIX")}/#{hash[0,2]}/#{hash[2,2]}/#{hash}"
  obj = $s3Bucket.object(s3Path)
  obj.exists? or halt(404)
  Tempfile.open("s3_", TEMP_DIR) { |s3Tmp|
    obj.get(response_target: s3Tmp)
    s3Tmp.seek(0)
    etag hash
    cache_control :public, :max_age => 3600   # maybe more?
    send_file(s3Tmp,
              last_modified: obj.last_modified,
              type: obj.metadata["mime_type"] || "application/octet-stream",
              disposition: "inline",
              filename: (obj.metadata["original_path"] || "").sub(%r{.*/}, ''))
    s3Tmp.unlink
  }
end

###################################################################################################
def streamFromS3(_itemID, s3Obj)
  s3Obj.exists? or halt(404)
  outLen = s3Obj.content_length

  content_type s3Obj.content_type

  # So we have to explicitly tell the client we accept ranges. With this, pdf.js will show the
  # first page before downloading the entire file.
  headers "Accept-Ranges" => "bytes"

  # Control how long this remains in browser and CloudFront caches
  cache_control :public, :max_age => 3600   # maybe more?

  # Stream the file from S3
  range = request.env["HTTP_RANGE"]
  if range
    range =~ /^bytes=(\d+)-(\d+)?/ or raise("can't parse range #{range.inspect}")
    fromByte, toByte = $1.to_i, $2.to_i
    if toByte.nil? || toByte == 0
      toByte = outLen
    end
    #puts "range #{fromByte}-#{toByte}/#{outLen}"
    headers "Content-Range" => "bytes #{fromByte}-#{toByte}/#{outLen}"
    outLen = toByte - fromByte + 1
    status 206
  end
  headers "Content-Length" => outLen.to_s,
          "ETag" => s3Obj.etag,
          "Last-Modified" => s3Obj.last_modified.httpdate
  stream { |out|
    s3Obj.get(range: range) { |block|
      out << block
    }
  }
end

###################################################################################################
get "/content/:fullItemID/*" do |itemID, path|
  # Prep work
  itemID =~ /^qt[a-z0-9]{8}$/ or halt(404)  # protect against attacks
  item = Item[itemID] or halt(404)
  item.status == 'published' or halt(403) # prevent access to embargoed, withdrawn, and pending files
  path = sanitizeFilePath(path)  # protect against attacks

  # Some items have a date-based download restriction. In this case, we only support the
  # no-splash version used for pdf.js rendering, and protected (lightly) by a key. Note that
  # supp files are explicitly allowed, e.g. for the Greek Satyr Play. See
  # https://www.pivotaltracker.com/story/show/152981894
  attrs = JSON.parse(item[:attrs])
  if attrs['disable_download'] && Date.parse(attrs['disable_download']) > Date.today && path =~ /^qt\w{8}\.pdf$/
    halt 403, "Download restricted until #{attrs['disable_download']}"
  end

  # Let crawlers know that the canonical URL is the item page.
  headers "Link" => "<https://escholarship.org/uc/item/#{itemID.sub(/^qt/,'')}>; rel=\"canonical\""

  # Grunt work for streaming the file from S3
  return streamFromS3(itemID, $s3Bucket.object("#{getEnv("S3_CONTENT_PREFIX")}/#{itemID}/#{path}"))
end

###################################################################################################
get "/preview/:fullItemID/*" do |itemID, path|
  # Prep work
  itemID =~ /^qt[a-z0-9]{8}$/ or halt(404)  # protect against attacks
  item = Item[itemID] or halt(404)
  item.status == "pending" or halt(403) # can't access published items through preview URL
  isValidPreviewKey(itemID, params[:preview_key]) or halt(403)
  path = sanitizeFilePath(path)  # protect against attacks

  # Grunt work for streaming the file from S3
  return streamFromS3(itemID, $s3Bucket.object("#{getEnv("S3_PREVIEW_PREFIX")}/#{itemID}/#{path}"))
end

###################################################################################################
def getPageData(path)
  #puts "Routing on path #{path.sub(%r{/$}, '')}"
  case path.sub(%r{/$}, '')  # forgive trailing slash
    when ""; getHomePageData
    when "/campuses"; browseAllCampuses
    when "/journals"; browseAllJournals
    when %r{^/([^/]+)/(units|journals)$}; getCampusBrowseData($1, $2)
    when %r{^/uc/item/([^/]+)$}; getItemPageData($1)
    when %r{^/uc/author/([^/]+)/stats(/([^/]+))?$}; authorStatsData("ark:/99166/#{$1}", $3 || "summary")
    when %r{^/uc/([^/]+)/stats(/([^/]+))?$}; unitStatsData($1, $3 || "summary")
    when %r{^/uc/([^/]+)(/([^/]+))?(/([^/]+))?$}; getUnitPageData($1, $3 || "home", $5)
    when %r{^/userAccount/(\d+)$}; getUserAccountData($1)
    when "/search"; getSearchData
    when "/login"; loginStartData
    when %r{/loginSuccess(/.*)?}; loginValidateData
    when "/logout"; { header: getGlobalHeader }
    when %r{/logoutSuccess(/.*)?}; { header: getGlobalHeader }
    else getGlobalStaticData(path)
  end
end

###################################################################################################
# Translate incoming page data requests to the proper internal API
get %r{/api/pageData([^\?]+)} do |path|
  content_type :json
  return getPageData(path).to_json
end

###################################################################################################
# If a cache buster comes in, strip it down to the original, and re-dispatch the request to return
# the actual file.
get %r{\/css\/main-[a-zA-Z0-9]{16}\.css} do
  call env.merge("PATH_INFO" => "/css/main.css")
end

###################################################################################################
# The outer framework of every page is essentially the same, substituting in the intial page
# data and initial elements from React.
get %r{.*} do
  # The regex below ensures that /api, /content, /locale, and files with a file ext get served
  # elsewhere.
  if request.path_info =~ %r{api/.*|content/.*|locale/.*|.*\.[a-zA-Z]\w{0,3}}
    pass
  else
    generalResponse
  end
end

###################################################################################################
def generalResponse
  # Replace startup URLs for proper cache busting
  template = File.new("app/app.html").read
  webpackManifest = JSON.parse(File.read('app/js/manifest.json'))
  template.sub!("/js/vendors~app.js", "#{webpackManifest["vendors~app.js"]}")
  template.sub!("/js/app.js", "#{webpackManifest["app.js"]}")
  template.sub!("/css/main.css", "/css/main-#{Digest::MD5.file("app/css/main.css").hexdigest[0,16]}.css")

  # In development mode, skip iso
  ENV['ISO_PORT'] or return template

  # Skip ISO for CMS pages, since we need to check credentials that are held in browser session storage,
  # and thus don't have access until Javascript is running on the client side.
  if request.path =~ %r{/(profile|carousel|issueConfig|userConfig|unitBuilder|nav|sidebar|redirects|authorSearch|userAccount)\b}
    puts "Skipping ISO for CMS page."
    return template
  end

  # Also skip ISO for the rare credential-protected stats pages
  if request.path =~ %r{/stats/(deposits_by_oa|all_users)\b}
    puts "Skipping ISO for credential-affected stats page."
    return template
  end

  # Get API data
  pageData = nil
  apiErr = catch(:halt) {
    begin
      pageData = getPageData(request.path_info)
      pageData.is_a?(Hash) or raise("an API function failed to return a hash, for path=#{request.path_info.inspect}")
    rescue Exception => e
      puts "Exception getting page data: #{e}\n    #{e.backtrace.join("\n    ")}"
      pageData = { error: true, message: "Server Error" }
    end
    nil
  }

  content_type :html  # in case it got set to json

  # If there was any error from APIs, return an ISO error page.
  if apiErr
    unit = $unitsHash['root']
    attrs = JSON.parse(unit[:attrs])
    pageData = {
      unit: unit.values.reject{|k,_v| k==:attrs},
      header: getUnitHeader(unit, nil, nil, attrs),
      error: true
    }
    if apiErr.is_a?(Array)
      status apiErr[0] || 500
      if apiErr[1].is_a?(String)
        if apiErr[1] =~ /{/
          begin
            parsed = JSON.parse(apiErr[1])
            parsed['error'] && parsed['message'] or raise("APIs should jsonHalt")
            pageData[:message] = parsed['message']
          rescue
            pageData[:message] = apiErr[1]
          end
        else
          pageData[:message] = apiErr[1]
        end
      else
        pageData[:message] = "Error"
      end
    elsif apiErr.is_a?(Numeric)
      status apiErr
      pageData[:message] = apiErr == 404 ? "Not Found" : "Error"
    else
      raise("can't figure out apiErr: #{apiErr.inspect}")
    end
  end

  # Parse out payload of the URL (i.e. not including the host name)
  request.url =~ %r{^https?://([^/:]+)(:\d+)?(.*)$} or fail
  remainder = $3

  # Pass the full path and query string to our little Node Express app, which will run it through
  # ReactRouter and React.
  response = HTTParty.post("http://#{$host}:#{ENV['ISO_PORT']}#{remainder}",
               :headers => { 'Content-Type' => 'application/json' },
               :body => pageData.to_json,
               :timeout => 20)
  if response.code != 200
    # If there's an exception (like iso is completely dead), fall back to non-iso mode.
    puts "Warning: unexpected error from iso (falling back): #{response.code} - #{response.body}"
    metaTags = "<title>ISO error - eScholarship</title>"
    template.sub!('<metaTags></metaTags>', metaTags) or raise("missing template section")
    return template
  end

  # Extract meta tags so we can put them in <head>
  metaTags, body = "", response.body
  if body =~ %r{<metaTags>(.*)</metaTags>(.*)$}m
    metaTags, body = $1, $2
    metaTags.gsub!(/>\s*</, ">\n  <")  # add some newlines to make it look nice
  end

  # We need to turn the page data into a code snippet. It's not as straightforward as one mightt hink.
  # For instance, unicode characters can't be inline (at least, it doesn't work for me); rather, they
  # have to be encoded in "\uXXYY" form.
  #
  # For a test sample see the copyright symbol near the end of the abstract in qt0015h4ns.
  jsonPageData = pageData.to_json
  jsonPageData.gsub!(/[\u007F-\uFFFF]/) { |m| "\\u%04X" % m.codepoints[0] }

  # Also, backslashes are particularly difficult. First of all, they need to be escaped in the
  # javascript, so that's "\\". But you'll see eight backslashes below. What's that about? Well,
  # to produce two backslashes in the output, you need four going in. In addition, because this
  # is going in to the String.sub! function, we have to double that to defeat them being interpreted
  # as backreferences to the match. Crazy cray cray.
  #
  # For a test sample, see the "5\%" near the end of the abstract in qt3f3256kv.
  jsonPageData.gsub!("\\", "\\\\\\\\")

  # In the template, substitute the results from React/ReactRouter, and the API data so the
  # client-side React code can successfully rehydrate the page.
  return template.sub('<metaTags></metaTags>', metaTags).
                  sub('<script></script>', "<script>window.jscholApp_initialPageData = #{jsonPageData};</script>").
                  sub('<div id="main"></div>', body)
end

# Not found errors on /content, /api, etc.
not_found do
  status 404
  if request.path =~ %r{\.[^/]+$}   # handle probable file paths like .jpg, .gif, etc.
    return "Resource not found.\n"
  elsif request.path =~ %r{/(api|graphql)/}
    return jsonHalt(404, "Not Found")
  elsif request.path =~ %r{/(dspace|oai)}
    return halt(404, "Not Found.\n")
  else
    generalResponse
  end
end

###################################################################################################
# Home Page 
def getHomePageData
  return {
    :header => getGlobalHeader,
    :hero_data => getCampusHero,
    :stats => {
      :statsCountItems => $statsCountItems,
      :statsCountViews => $statsCountViews,
      :statsCountOpenItems => $statsCountOpenItems,
      :statsCountEscholJournals => $statsCountEscholJournals,
      :statsCountOrus => $statsCountOrus,
      :statsCountArticles => $statsCountArticles,
      :statsCountThesesDiss => $statsCountThesesDiss,
      :statsCountBooks => $statsCountBooks
    }
  }
end

###################################################################################################
# Deposit Wizard get ORUS for a campus
get "/api/wizardlyORUs/:campusID" do |campusID|
  cu = flattenDepts($hierByAncestor[campusID].map(&:values).map{|x| x[:unit_id]})
  return cu.sort_by{ |u| u["name"] }.to_json
end

# Returns an array like [{"id"=>"uceap", "name"=>"UCEAP Mexico", "directSubmit"=>"enabled"}, ...]
def flattenDepts(ids, a=[])
  if ids.class == Array
    ids.each {|x| flattenDepts(x,a)}
  else
    unit = $unitsHash[ids]
    unitAttrs = JSON.parse(unit.attrs)
    a << {"id" => unit.id, "name" => unit.name, "directSubmit" => unitAttrs['directSubmit'], "directManage" => unitAttrs['directManage'],} unless unit.type != 'oru'
    children = $hierByAncestor[unit.id]
    children and children.each do |c|
        unit = $unitsHash[c.unit_id]
        flattenDepts(unit.id, a)
      end
  end
  a 
end

###################################################################################################
# Deposit Wizard get series for an ORU 
get "/api/wizardlySeries/:unitID" do |unitID|
  children = $hierByAncestor[unitID]
  os = children ? children.select { |u| u.unit.type.include?('series') }.map {|u|
   unitAttrs = JSON.parse(u.unit.attrs)
   {'id': u.unit_id, 'name': u.unit.name, 'directSubmit': unitAttrs['directSubmit'], 'directManage': unitAttrs['directManage']}
  } : []
  return os ? os.sort_by{ |u| u[:name] }.to_json : nil
end

###################################################################################################
# Browse all campuses
def browseAllCampuses
  # Build array of hashes containing campus and stats
  stats = []
  $activeCampuses.each do |k, v|
    pub_count =     ($statsCampusItems.keys.include? k) ? $statsCampusItems[k]    : 0
    unit_count =    ($statsCampusOrus.keys.include? k)  ? $statsCampusOrus[k]     : 0
    journal_count = ($statsCampusJournals.keys.include? k) ? $statsCampusJournals[k] : 0
    stats.push({"id"=>k, "name"=>v.values[:name], "type"=>v.values[:type], 
      "publications"=>pub_count, "units"=>unit_count, "journals"=>journal_count})
  end
  otherCampuses = ['anrcs', 'lbnl', 'ucop'] 
  unit = $unitsHash['root']
  body = {
    :header => getGlobalHeader,
    :unit => unit.values.reject{|k,_v| k==:attrs},
    :sidebar => getUnitSidebar(unit),
    :browse_type => "campuses",
    :campusesStats => stats.select { |h| !otherCampuses.include?(h['id']) },
    :otherStats => stats.select { |h| otherCampuses.include?(h['id']) }
  }
  breadcrumb = [{"name" => "Campuses and Other Locations", "url" => "/campuses"},]
  return body.merge(getHeaderElements(breadcrumb, nil))
end

###################################################################################################
# Browse all journals
def browseAllJournals
  journals = $campusJournals.sort_by{ |h| h[:name].downcase }
  unit = $unitsHash['root']
  body = {
    :header => getGlobalHeader,
    :unit => unit.values.reject{|k,_v| k==:attrs},
    :sidebar => getUnitSidebar(unit),
    :browse_type => "all_journals",
    :journals => journals.select{ |h| h[:status]!="archived" },
    :archived => journals.select{ |h| h[:status]=="archived" }
  }
  breadcrumb = [{"name" => "Journals", "url" => "/journals"},]
  return body.merge(getHeaderElements(breadcrumb, "All Campuses"))
end

###################################################################################################
# Browse a campus's units or journals
def getCampusBrowseData(campusID, browse_type)
  cu, cj, pageTitle = nil, nil, nil
  unit = $unitsHash[campusID]
  unit or halt(404, "campusID not found")
  if browse_type == 'units'
    cu = $hierByAncestor[campusID].sort_by{ |h| $unitsHash[h[:unit_id]].name }.map do |a|
      getChildDepts($unitsHash[a.unit_id])
    end
    pageTitle = "Academic Units"
  else   # journals
    cj  = $campusJournals.select{ |j| j[:ancestor_unit].include?(campusID) }.sort_by{ |h| h[:name].downcase }
    cja = cj.select{ |h| h[:status]=="archived" }
    cj  = cj.select{ |h| h[:status]!="archived" }
    pageTitle = "Journals"
  end
  body = {
    :browse_type => browse_type,
    :pageTitle => pageTitle,
    :unit => unit ? unit.values.reject { |k,_v| k==:attrs } : nil,
    :header => unit ? getUnitHeader(unit) : getGlobalHeader,
    :sidebar => getUnitSidebar(unit),
    :campusUnits => cu ? cu.compact : nil,
    :campusJournals => cj,
    :campusJournalsArchived => cja
  }
  breadcrumb = [
    {"name" => pageTitle, "url" => "/" + campusID + "/" + browse_type},
    {"name" => unit.name, "url" => "/uc/" + campusID}]
  return body.merge(getHeaderElements(breadcrumb, nil))
end

# Returns an array like [{"id"=>"uceap", "name"=>"UCEAP Mexico", "children" => []}, ...]
def getChildDepts(unit)
  # this function is used for unit browse data. skip the hidden units
  if unit.type != 'oru' or unit.status == 'hidden'
    return nil
  else
    node = {"id" => unit.id, "name" => unit.name}
    if $hierByAncestor[unit.id]
      child = $hierByAncestor[unit.id].map { |c| getChildDepts($unitsHash[c.unit_id]) }.compact
      if child[0] then node["children"] = child.sort_by{|u| u["name"]} end
    end
    return node
  end
end

###################################################################################################
# Global static pages; also, a fallback for global not-found.
def getGlobalStaticData(path)
  pageName = path.sub(%r{^/}, "")
  if pageName =~ %r{^[a-zA-Z]([a-zA-Z_]+/)*[a-zA-Z_]+$} && Page.where(unit_id: 'root', slug: pageName).count > 0
    unit = $unitsHash['root']
    attrs = JSON.parse(unit[:attrs])
    return {
      unit: unit.values.reject{|k,_v| k==:attrs},
      sidebar: getUnitSidebar(unit),
      header: getUnitHeader(unit, pageName, nil, attrs),
      content: getUnitStaticPage(unit, attrs, pageName)
    }
  else
    jsonHalt(404, "Not Found")
  end
end

###################################################################################################
# User account data
def getUserAccountData(userID)
  # Only super-users allowed to see or edit user accounts
  getUserPermissions(params[:username], params[:token], 'root')[:super] or halt(401)

  # Get general data
  query = Sequel::SQL::PlaceholderLiteralString.new(%{
    select last_name, first_name, email,
    date_registered, date_last_login, date_validated
    from users where user_id = :userID}.unindent, { userID: userID })
  generalData = OJS_DB.fetch(query).first.to_h

  # Get flags
  query = Sequel::SQL::PlaceholderLiteralString.new(
    "select setting_name, setting_value from user_settings where user_id = :userID", { userID: userID })
  flags = Hash[OJS_DB.fetch(query).map { |row|
    [row[:setting_name], row[:setting_value]]
  }]

  # Get forwarding
  query = Sequel::SQL::PlaceholderLiteralString.new(
    "select email from eschol_prev_email where user_id = :userID", { userID: userID })
  prevEmails = OJS_DB.fetch(query).map { |row| row[:email] }

  # Get eschol unit permissions
  query = Sequel::SQL::PlaceholderLiteralString.new(
    "select unit_id, role from eschol_roles where user_id = :userID", { userID: userID })
  unitRoles = Hash.new { |h,k| h[k] = [] }
  OJS_DB.fetch(query).each { |row|
    unitRoles[row[:unit_id]] << row[:role]
  }

  # Get journals and associated role permissions
  query = Sequel::SQL::PlaceholderLiteralString.new(%{
    select journals.path,
      case
        when role_id =       1 then 'admin'
        when role_id =      16 then 'manager'
        when role_id =     256 then 'editor'
        when role_id =     512 then 'section editor'
        when role_id =     768 then 'layout editor'
        when role_id =    4096 then 'reviewer'
        when role_id =    8192 then 'copy editor'
        when role_id =   12288 then 'proofreader'
        when role_id =   65536 then 'author'
        when role_id = 1048576 then 'reader'
        when role_id = 2097152 then 'subscription manager'
      end as role
    from users
    left join roles on users.user_id = roles.user_id
    left join journals on journals.journal_id = roles.journal_id
    where users.user_id = :userID
    order by journals.path
  }.unindent, { userID: userID })
  journalRoles = Hash.new { |h,k| h[k] = [] }
  OJS_DB.fetch(query).each { |row|
    journalRoles[row[:path]] << row[:role]
  }

  # Get forwarded email addresses
  query = Sequel::SQL::PlaceholderLiteralString.new("select * from eschol_prev_email where user_id = :userID", { userID: userID })
  prevEmails = OJS_DB.fetch(query).map { |row| row[:email] }

  return { user_id: userID,
           last_name: generalData[:last_name],
           first_name: generalData[:first_name],
           email: generalData[:email],
           registered: generalData[:date_registered],
           last_login: generalData[:date_last_login],
           flags: { validated: !generalData[:date_validated].nil?,
                    superuser: flags['eschol_superuser'] == 'yes',
                    opted_out: flags['eschol_opt_out'] == 'yes',
                    bouncing:  flags['eschol_bouncing_email'] == 'yes' },
           unit_roles: unitRoles.to_a,
           journal_roles: journalRoles.to_a,
           prev_emails: prevEmails }
end

###################################################################################################
def changeOJSFlag(userID, flag, oldValue, newValue)
  oldValue == newValue and return  # no-op
  OJS_DB.run(Sequel::SQL::PlaceholderLiteralString.new(
    "delete from user_settings where setting_name = :flag and user_id = :userID",
    { flag: flag, userID: userID }))
  if newValue
    OJS_DB.run(Sequel::SQL::PlaceholderLiteralString.new(%{
      insert into user_settings(user_id, locale, setting_name, setting_value, setting_type)
      values (:userID, 'en_US', :flag, 'yes', 'string')
    }, { flag: flag, userID: userID }))
  end
end

###################################################################################################
def validateUserID(userID)
  row = OJS_DB.fetch(Sequel::SQL::PlaceholderLiteralString.new(
    "select email from users where user_id = :userID",
    { userID: userID })).first
  row.nil? and jsonHalt(400, "Invalid user ID")
end

###################################################################################################
put "/api/userFlags/:userID" do |userID|
  # Only super-users allowed to see or edit user accounts
  getUserPermissions(params[:username], params[:token], 'root')[:super] or halt(401)
  validateUserID(userID)

  # Get data to compare with
  oldData = getUserAccountData(userID)[:flags]

  # Make updates
  newData = params['data']
  changeOJSFlag(userID, 'eschol_superuser',      oldData[:superuser], newData['flag_superuser'] == 'on')
  changeOJSFlag(userID, 'eschol_opt_out',        oldData[:opted_out], newData['flag_opted_out'] == 'on')
  changeOJSFlag(userID, 'eschol_bouncing_email', oldData[:bouncing],  newData['flag_bouncing']  == 'on')
  if (val = newData['flag_validated'] == 'on') != oldData[:validated]
    OJS_DB.run(Sequel::SQL::PlaceholderLiteralString.new(
      "update users set date_validated = :val where user_id = :userID",
      { userID: userID, val: val ? DateTime.now.iso8601 : nil }))
  end
  if (val = newData['new_password']) && !val.empty?
    uname = OJS_DB.fetch(Sequel::SQL::PlaceholderLiteralString.new(
      "select username from users where user_id = :userID", { userID: userID })).first[:username]
    OJS_DB.run(Sequel::SQL::PlaceholderLiteralString.new(
      "update users set password = :hash where user_id = :userID",
      { userID: userID, hash: Digest::SHA1.hexdigest(uname + val) }))
  end

  content_type :json
  return { status: "ok" }.to_json
end

###################################################################################################
post "/api/userEmailForward/:userID" do |userID|
  # Only super-users allowed to see or edit user accounts
  getUserPermissions(params[:username], params[:token], 'root')[:super] or halt(401)
  validateUserID(userID)

  # Validate the email address. See https://www.regular-expressions.info/email.html
  email = params.dig('data', 'email')
  email =~ %r{^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$}i or jsonHalt(400, "Invalid email")

  # Make sure there's not already a mapping for this
  row = OJS_DB.fetch(Sequel::SQL::PlaceholderLiteralString.new(
    "select user_id from eschol_prev_email where user_id = :userID and lower(email) = :email",
    { userID: userID, email: email.downcase })).first
  row and jsonHalt(400, "Duplicate entry")

  # Make sure there's not already a matching user account for this
  row = OJS_DB.fetch(Sequel::SQL::PlaceholderLiteralString.new(
    "select user_id from users where lower(email) = :email",
    { email: email.downcase })).first
  row and jsonHalt(400, "Prev email has an account - did you mean to update it?")

  # Ok to insert.
  OJS_DB.run(Sequel::SQL::PlaceholderLiteralString.new(
    "insert into eschol_prev_email(user_id, email) values (:userID, :email)",
    { userID: userID, email: email.downcase }))

  content_type :json
  return { status: "ok" }.to_json
end

###################################################################################################
delete "/api/userEmailForward/:userID" do |userID|
  # Only super-users allowed to see or edit user accounts
  getUserPermissions(params[:username], params[:token], 'root')[:super] or halt(401)
  validateUserID(userID)

  # Ok to delete.
  email = params.dig('data', 'email')
  OJS_DB.run(Sequel::SQL::PlaceholderLiteralString.new(
    "delete from eschol_prev_email where user_id = :userID and lower(email) = :email",
    { userID: userID, email: email.downcase }))

  content_type :json
  return { status: "ok" }.to_json
end

###################################################################################################
# Unit page data. 
# pageName may be some administrative function (nav, profile), specific journal volume, or static page name
def getUnitPageData(unitID, pageName, subPage)
  unit = Unit[unitID] or jsonHalt(404, "Unit not found")
  attrs = JSON.parse(unit[:attrs])
  pageName == "stats" and return unitStatsData(unitID, subPage)
  if pageName
    ext = nil
    begin
      ext = extent(unit.id, unit.type)
    rescue Exception => e
      puts "Error building page data: #{e} #{e.backtrace}"
      jsonHalt 404, "Error building page data:" + e.message
    end
    pageData = {
      unit: unit.values.reject{|k,_v| k==:attrs}.merge(:extent => ext),
      sidebar: getUnitSidebar(unit.type.include?('series') ? getUnitAncestor(unit) : unit)
    }

    issuesSubNav, issueIds, issuesPublished, journalIssue = nil, nil, nil, nil
    # Gather header data
    if unit.type == 'journal'
      issueIds = getIssueIds(unit)
      issuesPublished = (issueIds && issueIds.any?) ? getPublishedJournalIssues(issueIds) : nil
      issuesSubNav = getIssuesSubNav(issuesPublished)

      if isJournalIssue?(unit.id, pageName, subPage)
        volume = pageName
        issue = subPage
        numbering, title, show_pub_dates = getIssueNumberingTitle(unit.id, volume, issue)
        journalIssue = {'unit_id': unit.id, 'volume': volume, 'issue': issue, 'title': title, 'numbering': numbering, 'show_pub_dates': show_pub_dates}
      end
      pageData[:header] = getUnitHeader(unit, nil, journalIssue, issuesSubNav, attrs)
    else
      pageData[:header] = getUnitHeader(unit, 
      (pageName =~ /^(nav|sidebar|profile|carousel|issueConfig|userConfig|redirects|unitBuilder|authorSearch)/) ?
        nil : pageName, nil, nil, attrs)
    end

    # Gather page content data
    if ["home", "search"].include? pageName  # 'home' here refers to the unit's homepage, not root home
      q = nil
      q = CGI::parse(request.query_string) if pageName == "search"
      pageData[:content] = getUnitPageContent(unit: unit, attrs: attrs, query: q,
                             issueIds: issueIds, issuesPublished: issuesPublished)
      # For journals, Issues SubNav data shared in header and body
      pageData[:content][:issuesSubNav] = issuesSubNav
    elsif pageName == 'profile'
      pageData[:content] = getUnitProfile(unit, attrs)
    elsif pageName == 'carousel'
      # ToDo: Cleanup this which duplicates marquee info below
      pageData[:content] = getUnitCarouselConfig(unit, attrs)
    elsif pageName == 'issueConfig'
      pageData[:content] = getUnitIssueConfig(unit, attrs)
    elsif pageName == 'userConfig'
      pageData[:content] = getUnitUserConfig(unit)
    elsif pageName == 'unitBuilder'
      pageData[:content] = getUnitBuilderData(unit)
    elsif pageName == 'nav'
      pageData[:content] = getUnitNavConfig(unit, attrs['nav_bar'], subPage)
    elsif pageName == 'sidebar'
      pageData[:content] = getUnitSidebarWidget(unit, subPage)
    elsif pageName == "redirects"
      pageData[:content] = getRedirectData(subPage)
    elsif pageName == "authorSearch"
      pageData[:content] = getAuthorSearchData
    elsif isJournalIssue?(unit.id, pageName, subPage)
      pageData[:content] = getJournalIssueData(unit, attrs, 
        issueIds, issuesPublished, pageName, subPage)
      pageData[:content][:issuesSubNav] = issuesSubNav
    else
      pageData[:content] = getUnitStaticPage(unit, attrs, pageName)
    end
    pageData[:marquee] = getUnitMarquee(unit, attrs) if (["home", "search"].include? pageName or unit.type == 'journal')
  else
    #public API data
    pageData = {
      unit: unit.values.reject{|k,_v| k==:attrs}
    }
  end
  return pageData
end

###################################################################################################
def calcNoSplashKey(shortArk)
  Digest::MD5.hexdigest("noSplash:#{$jscholKey}|qt#{shortArk}")
end

###################################################################################################
def calcPreviewKey(shortArk, date = nil)
  Digest::MD5.hexdigest("pvw_v01:#{shortArk}:#{(date || Date.today).iso8601}:#{$jscholKey}")
end

###################################################################################################
def isValidPreviewKey(shortArk, key)
  # Try yesterday, today, and tomorrow (the latter to account for people across the dateline)
  (-1..1).each { |offset|
    if key == calcPreviewKey(shortArk, Date.today + offset)
      return true
    end
  }
  puts "Want preview_key #{calcPreviewKey(shortArk, Date.today).inspect} but got #{key.inspect}."
  return false
end

###################################################################################################
def getItemUsage(itemID)
  ItemStat.where(item_id: itemID).order(:month).to_hash(:month).map { |m,v|
    attrs = JSON.parse(v.attrs)
    { month: "#{m.to_s[0..3]}-#{m.to_s[4..5]}", hits: attrs['hit'] || 0, downloads: attrs['dl'] || 0 }
  }
end

###################################################################################################
# Item view page data.
def getItemPageData(shortArk)
  id = "qt"+shortArk
  item = Item[id] or halt(404)
  item.status == "withdrawn-junk" and halt(404)
  # Only allow access to preview items if the proper key is specified
  if item.status == 'pending'
    isValidPreviewKey(id, params[:preview_key]) or halt(403, "Unauthorized")
  end

  attrs = JSON.parse(item.attrs)
  unitIDs = UnitItem.where(:item_id => id, :is_direct => true).order(:ordering_of_units).select_map(:unit_id)
  unit = unitIDs ? Unit[unitIDs[0]] : nil
  pdf_url = nil
  if item.content_type == "application/pdf" && %w{published pending}.include?(item.status)
    pdf_url = (item.status == 'pending' ? "/preview/" : "/content/") + id + "/" + id + ".pdf"
    displayPDF = DisplayPDF[id]
    if displayPDF && displayPDF.orig_timestamp
      pdf_url += "?t=#{displayPDF.orig_timestamp.to_i.to_s(36)}"
    end
  end

  if !item.nil?
    authors = ItemAuthors.filter(:item_id => id).order(:ordering).
                 map(:attrs).collect{ |h| JSON.parse(h)}
    editors = ItemContrib.filter(:item_id => id, :role => 'editor').order(:ordering).
                 map(:attrs).collect{ |h| JSON.parse(h)}
    advisors = ItemContrib.filter(:item_id => id, :role => 'advisor').order(:ordering).
                 map(:attrs).collect{ |h| JSON.parse(h)}
    citation = getCitation(unit, shortArk, authors, attrs)
    begin
      body = {
        # ToDo: Normalize author attributes across all components (i.e. 'family' vs. 'lname')
        :added => item.added,
        :advisors => advisors.any? ? advisors : nil,
        :altmetrics_ok => false,
        :appearsIn => unitIDs ? unitIDs.map { |unitID| {"id" => unitID, "name" => Unit[unitID].name} }
                              : nil,
        :attrs => attrs,
        :authors => authors,
        :citation => citation,
        :content_html => getItemHtml(item.content_type, id, item.status == "pending"),
        :content_key => calcNoSplashKey(shortArk),
        :content_type => item.content_type,
        :data_digest => item.data_digest,            # Strictly used for admin reference
        :editors => editors.any? ? editors : nil,
        :genre => item.genre,
        :id => shortArk,
        :index_digest => item.index_digest,          # Strictly used for admin reference
        :last_indexed => item.last_indexed,          # Strictly used for admin reference
        :oa_policy => item.oa_policy,                # Strictly used for admin reference
        :ordering_in_sect => item.ordering_in_sect,  # Strictly used for admin reference
        :pdf_url => pdf_url,
        :preview_key => params[:preview_key],
        :published => item.published.to_s =~ /^(\d\d\d\d)-01-01$/ ? $1 : item.published,
        :rights => item.rights,
        :sidebar => unit ? getItemRelatedItems(unit, id) : nil,
        :source => item.source,                      # Strictly used for admin reference
        :status => item.status,
        :submitted => item.submitted,                # Strictly used for admin reference
        :title => citation[:title],
        :unit => unit ? unit.values.reject { |k,_v| k==:attrs } : nil,
        :usage => getItemUsage(id),
      }

      if attrs['disable_download'] && Date.parse(attrs['disable_download']) > Date.today
        body[:download_restricted] = Date.parse(attrs['disable_download']).iso8601
      end

      if unit
        unit_attrs = JSON.parse(unit[:attrs])
        body[:unit_attrs] = unit_attrs               # Strictly used for admin reference
        if unit.type != 'journal'
          body[:header] = getUnitHeader(unit)
          body[:altmetrics_ok] = true
        else 
          body[:altmetrics_ok] = unit_attrs['altmetrics_ok']
          issue_id = Item.join(:sections, :id => :section).filter(Sequel.qualify("items", "id") => id).map(:issue_id)[0]
          if issue_id
            unit_id, volume, issue = Section.join(:issues, :id => issue_id).map([:unit_id, :volume, :issue])[0]
            numbering, title, show_pub_dates = getIssueNumberingTitle(unit.id, volume, issue)
            issueIds = getIssueIds(unit)
            issuesSubNav = getIssuesSubNav((issueIds && issueIds.any?) ? getPublishedJournalIssues(issueIds) : nil)
            body[:header] = getUnitHeader(unit, nil,
              {'unit_id': unit_id, 'volume': volume, 'issue': issue, 'title': title, 'numbering': numbering, 'show_pub_dates': show_pub_dates}, issuesSubNav)
            body[:numbering] = numbering
            body[:show_pub_dates] = show_pub_dates
            body[:citation][:volume] = volume
            body[:citation][:issue] = issue
          else
            body[:header] = getUnitHeader(unit, nil, nil)
          end
        end
        body[:commenting_ok] = unit_attrs['commenting_ok'] && item.status == 'published'
      end
      # pp(body)
      return body
    rescue Exception => e
      puts "Error in item API: #{e} #{e.backtrace}"
      halt 404, e.message
    end
  else 
    puts "Item not found!"
    halt 404, "Item not found"
  end
end

#################################################################################################
# Send a mutation to the submission API, returning the JSON results.
def submitAPIMutation(mutation, vars)
  query = "mutation(#{vars.map{|name, pair| "$#{name}: #{pair[0]}"}.join(", ")}) { #{mutation} }"
  varHash = Hash[vars.map{|name,pair| [name.to_s, pair[1]]}]
  api_access_key = getEnv("ESCHOL_API_ACCESS_KEY")
  headers = { 'Content-Type' => 'application/json',
              'Privileged' => getEnv("ESCHOL_PRIV_API_KEY") }
  unless (api_access_key.to_s == '')
    response = HTTParty.post("#{$escholApiServer}/graphql",
               :headers => headers,
               :query => { access: api_access_key },
               :body => { variables: varHash, query: query }.to_json.gsub("%", "%25"))
  else
    response = HTTParty.post("#{$escholApiServer}/graphql",
      :headers => headers,
      :body => { variables: varHash, query: query }.to_json.gsub("%", "%25"))
  end
  response.code != 200 and raise("Internal error (graphql): " +
     "HTTP code #{response.code} - #{response.message}.\n" +
     "#{response.body}")
  if response['errors']
    puts "Full error text:"
    pp response['errors']
    raise("Internal error (graphql): #{response['errors'][0]['message']}")
  end
  return response['data']
end

###################################################################################################
# Withdraw an item (super-users only)
delete "/api/item/:shortArk" do |shortArk|
  perms = getUserPermissions(params[:username], params[:token], "root")
  perms[:super] or halt(401)
  content_type :json
  if params[:redirectTo] && !(params[:redirectTo] =~ /^$|^qt\w{8}$/)
    jsonHalt(400, "invalid redirect id")
  end
  submitAPIMutation("withdrawItem(input: $input) { message }", { input: ["WithdrawItemInput!", {
    id: "ark:/13030/#{shortArk}",
    publicMessage: (params[:publicMessage]||"").empty? ? jsonHalt(400, "Public message is required") : params[:publicMessage],
    internalComment: (params[:internalComment]||"").empty? ? nil : params[:internalComment],
    redirectTo: (params[:redirectTo]||"").empty? ? nil : "ark:/13030/#{params[:redirectTo]}"
  }]})
  return { status: "ok", nextURL: "/uc/item/#{shortArk.sub(/^qt/,'')}" }.to_json
end

###################################################################################################
# Used to sanitize numeric parameters for search (and only search)
def forceNumeric(cgiParams, name)
  if cgiParams[name] && !(cgiParams[name].inspect =~ /^\[(\"\d+\")?\]$/)
    puts "Note: Filtering out invalid #{name.inspect} param: #{cgiParams[name].inspect}"
    cgiParams.delete(name)
  end
end

###################################################################################################
# Search page data
def getSearchData()
  body = {
    :header => getGlobalHeader,
    :campuses => getCampusesAsMenu
  }
  facetList = ['type_of_work', 'peer_reviewed', 'supp_file_types', 'pub_year',
               'campuses', 'departments', 'journals', 'disciplines', 'rights']

  # Does tricky extra stuff with params
  cgiParams = CGI::parse(request.query_string).transform_values{|a| a.map{|v| CGI::escapeHTML(v)}}
  cgiParams.default=[].freeze

  forceNumeric(cgiParams, 'start')
  forceNumeric(cgiParams, 'rows')
  searchType = cgiParams["searchType"][0]

  # Perform global search when searchType is assigned 'eScholarship'
  # otherwise: 'searchType' will be assigned the unit ID - and then 'searchUnitType' specifies type of unit.
  if searchType and searchType != "eScholarship"
    searchUnitType = cgiParams["searchUnitType"][0]
    if searchUnitType.nil? or searchUnitType == ''
      cgiParams["searchType"] = ["eScholarship"]
    else
      cgiParams[searchUnitType] = [searchType]
    end
  end
  return body.merge(search(cgiParams, facetList))
end

###################################################################################################
# Social Media Links  for type = (item|unit)
get "/api/mediaLink/:type/:id/:service" do |type, id, service| # service e.g. facebook, google, etc.
  content_type :json
  item = ''; path = ''
  if (type == "item")
    item = Item["qt"+id]
    title = item.title
    path = 'uc/item'
  else
    title = $unitsHash[id].name
    path = 'uc'
  end
  sharedLink = "https://escholarship.org/" + path + "/" + id 
  case service
    when "facebook"
      url = "https://www.facebook.com/sharer.php?u=" + sharedLink
    when "twitter"
      url = "https://twitter.com/intent/tweet?text=" + title + "&url=" + sharedLink + "&via=eScholarship"
    when "email"
      title_sm = title.length > 50 ? title[0..49] + "..." : title
      body = ''
      if (type == "item")
        # ToDo: Put in proper citation
        body = (item.attrs["orig_citation"] ? item.attrs["orig_citation"] + "%0D%0A%0D%0A" : "")
      else
        body = "View items by " + title + " published on eScholarship.%0D%0A%0D%0A" 
      end
      url = ("mailto:?subject=" + title_sm + "&body=%s" + sharedLink) % [body]
    when "mendeley"
      url = "http://www.mendeley.com/import?url=" + sharedLink + "&title=" + title
    when "citeulike"
      url = "http://www.citeulike.org/posturl?url=" + sharedLink + "&title=" + title
    else
      raise("unrecognized service")
  end
  return { url: url }.to_json
end

##################################################################################################
# Helper methods

def getGlobalHeader
  return getUnitHeader($unitsHash['root'])
end

# Generate breadcrumb and header content for Browse or Static page
def getHeaderElements(breadcrumb, topItem)
  campuses = topItem ? getCampusesAsMenu(topItem) : getCampusesAsMenu
  return {
    :campuses => campuses,
    :breadcrumb => breadcrumb ? Hierarchy_Manual.new(breadcrumb).generateCrumb : nil
  }
end

# Array of all active root level campuses/ORUs. Include empty label "eScholarship at..." 
def getCampusesAsMenu(topItem="eScholarship at...")
  campuses = []
  $activeCampuses.each do |_id, c| campuses << {id: c.id, name: c.name} end
  return campuses.unshift({:id => "", :name=>topItem})
end

def getCampusId(unit)
  r = UnitHier.where(unit_id: unit.id).where(ancestor_unit: $allCampuses.keys).first
  return (unit.type=='campus') ? unit.id : r ? r.ancestor_unit : 'root'
end

# Properly target links in HTML blob
def getItemHtml(content_type, id, isPending)
  return false if content_type != "text/html"

  s3Path = "#{getEnv(isPending ? "S3_PREVIEW_PREFIX" : "S3_CONTENT_PREFIX")}/#{id}/#{id}.html"
  s3Obj = $s3Bucket.object(s3Path)
  s3Obj.exists? or halt(404)

  buf = s3Obj.get().body.read.force_encoding("UTF-8")

  # Hacks for LIMN
  buf.gsub! %r{<head.*?</head>}im, ''
  buf.gsub! %r{<style.*?</style>}im, ''
  buf.gsub! %r{<iframe.*?</iframe>}im, ''
  buf.gsub! %r{<script.*?</script>}im, ''

  # Remap the links
  htmlStr = stringToXML(buf).to_xml
  htmlStr.gsub!(/(href|src)="((?!#)[^"]+)"/) { |_m|
    attrib, url = $1, $2
    url = url.start_with?("http", "ftp") ? url : "/#{isPending ? "preview" : "content"}/#{id}/#{url}"
    isPending and url += "?preview_key=#{calcPreviewKey(id)}"
    "#{attrib}=\"#{url}\"" + ((attrib == "src") ? "" : " target=\"new\"")
  }

  # Browsers don't seem to like <a name="foo"/>. Instead they want <a name="foo"></a>
  htmlStr.gsub!(%r{<a name="([^"]+)"/>}, '<a name="\1"></a>')

  # DOJ articles often specify target="new" on links, but that's no longer best practice.
  htmlStr.gsub!(%r{<a([^>]*) target="[^"]*"([^>]*)>}, '<a\1\2>')

  # All done
  return htmlStr
end

###################################################################################################
# Post from github notifying us of a push to the repo
post "/jscholGithubHook/onCommit" do
  puts "Got github commit hook - doing pull and restart."
  pid = spawn("/usr/bin/ruby tools/pullJschol.rb > /apps/eschol/tmp/pullJschol.log 2>&1")
  Process.detach(pid)
  return "ok"
end
