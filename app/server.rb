# Sample application foundation for eschol5 - see README.md for more info

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

###################################################################################################
# External gems we need
require 'aws-sdk'
require 'cgi'
require 'digest'
require 'httparty'
require 'json'
require 'logger'
require 'mimemagic'
require 'net/http'
require 'open-uri'
require 'pp'
require 'sequel'
require 'sinatra'
require 'tempfile'
require 'yaml'
require 'socksify'
require 'socket'

# Make puts thread-safe, and flush after every puts.
$stdoutMutex = Mutex.new
def puts(*args)
  $stdoutMutex.synchronize {
    #STDOUT.print Thread.current
    super(*args)
    STDOUT.flush
  }
end

# Make it clear where the new session starts in the log file.
puts "\n\n=====================================================================================\n"

def waitForSocks(host, port)
  first = true
  begin
    sock = TCPSocket.new(host, port)
    sock.close
  rescue Errno::ECONNREFUSED
    first and puts("Waiting for SOCKS proxy to start.")
    first = false
    sleep 0.5
    retry
  end
end

def ensureConnect(dbConfig)
  if TCPSocket::socks_port
    SocksMysql.new(dbConfig)
  end
  db = Sequel.connect(dbConfig)
  n = db.fetch("SHOW TABLE STATUS").all.length
  n > 0 or raise("Failed to connect to db.")
  return db
end

# Use the Sequel gem to get object-relational mapping, connection pooling, thread safety, etc.
# If specified, use SOCKS proxy for all connections (including database).
escholDbConfig = YAML.load_file("config/database.yaml")
ojsDbConfig = YAML.load_file("config/ojsDb.yaml")
if File.exist? "config/socks.yaml"
  # Configure socksify for all TCP connections. Jump through hoops for MySQL to use it too.
  socksPort = YAML.load_file("config/socks.yaml")['port']
  waitForSocks("127.0.0.1", socksPort)
  TCPSocket::socks_server = "127.0.0.1"
  TCPSocket::socks_port = socksPort
  require_relative 'socksMysql'
end
puts "Connecting to eschol DB.    "
DB = ensureConnect(escholDbConfig)
#DB.loggers << Logger.new('server.sql_log')  # Enable to debug SQL queries on main db
puts "Connecting to OJS DB.       "
OJS_DB = ensureConnect(ojsDbConfig)
#OJS_DB.loggers << Logger.new('ojs.sql_log')  # Enable to debug SQL queries on OJS db

# When fetching ISO pages and PDFs from the local server, we need the host name.
$host = ENV['HOST'] || "localhost"

# Need credentials for fetching content files from MrtExpress
$mrtExpressConfig = YAML.load_file("config/mrtExpress.yaml")

# Need a key for encrypting login credentials and URL keys
$jscholKey = open("config/jscholKey.dat").read.strip

# S3 API client
puts "Connecting to S3.           "
$s3Config = OpenStruct.new(YAML.load_file("config/s3.yaml"))
$s3Client = Aws::S3::Client.new(region: $s3Config.region)
$s3Bucket = Aws::S3::Bucket.new($s3Config.bucket, client: $s3Client)

# Internal modules to implement specific pages and functionality
require_relative 'dbCache'
require_relative 'hierarchy'
require_relative 'listViews'
require_relative 'searchApi'
require_relative 'queueWithTimeout'
require_relative 'unitPages'
require_relative 'citation'
require_relative 'loginApi'
require_relative 'fileCache'
require_relative '../util/sanitize.rb'
require_relative 'merritt'

# Sinatra configuration
configure do
  # Don't use Webrick, as sinatra-websocket requires 'thin', and 'thin' is better anyway.
  set :server, 'thin'
  # We like to use the 'app' folder for all our static resources
  set :public_folder, Proc.new { root }

  set :show_exceptions, false
end

# Compress responses
## NO: This fails when streaming files. Not sure why yet.
#use Rack::Deflater

# For general app development, set DO_ISO to false. For real deployment, set to true
DO_ISO = File.exist?("config/do_iso")

# Cache files from Merritt, S3, and the splash generator for a short time.
CACHE_DIR = "cache"
$fileCache = FileCache.new("cache")

TEMP_DIR = "tmp"
FileUtils.mkdir_p(TEMP_DIR)

# Special cache for Merritt that includes fetching synchronization
$merrittCache = MerrittCache.new

###################################################################################################
# Model classes for easy interaction with the database.
#
# For more info on the database schema, see contents of migrations/ directory, and for a more
# graphical version, see:
#
# https://docs.google.com/drawings/d/1gCi8l7qteyy06nR5Ol2vCknh9Juo-0j91VGGyeWbXqI/edit

class Unit < Sequel::Model
  unrestrict_primary_key
  one_to_many :unit_hier,     :class=>:UnitHier, :key=>:unit_id
  one_to_many :ancestor_hier, :class=>:UnitHier, :key=>:ancestor_unit
end

class UnitHier < Sequel::Model(:unit_hier)
  unrestrict_primary_key
  many_to_one :unit,          :class=>:Unit
  many_to_one :ancestor,      :class=>:Unit, :key=>:ancestor_unit
end

class UnitItem < Sequel::Model
  unrestrict_primary_key
end

class Item < Sequel::Model
  unrestrict_primary_key
end

class ItemAuthors < Sequel::Model(:item_authors)
  unrestrict_primary_key
end

class Issue < Sequel::Model
end

class Section < Sequel::Model
end

class Page < Sequel::Model
end

class Widget < Sequel::Model
end

class ItemCount < Sequel::Model
end

class DisplayPDF < Sequel::Model
  unrestrict_primary_key
end

##################################################################################################
# Thread synchronization class
class Event
  def initialize
    @lock = Mutex.new
    @cond = ConditionVariable.new
    @flag = false
  end
  def set
    @lock.synchronize do
      @flag = true
      @cond.broadcast
   end
  end
  def wait
    @lock.synchronize do
      if not @flag
        @cond.wait(@lock)
      end
    end
  end
end

##################################################################################################
# Database caches for speed. We check every 30 seconds for changes. These tables change infrequently.

$unitsHash, $hierByUnit, $hierByAncestor, $activeCampuses, $oruAncestors, $campusJournals,
  $statsCampusPubs, $statsCampusOrus, $statsCampusJournals = nil, nil, nil, nil, nil, nil, nil, nil, nil
$cachesFilled = Event.new
Thread.new {
  prevTime = nil
  while true
    utime = nil
    DB.fetch("SHOW TABLE STATUS WHERE Name in ('units', 'unit_hier')").each { |row|
      if row[:Update_time] && (!utime || row[:Update_time] > utime)
        utime = row[:Update_time]
      end
    }
    if !utime || utime != prevTime
      puts "Filling caches.           "
      $unitsHash = getUnitsHash
      $hierByUnit = getHierByUnit
      $hierByAncestor = getHierByAncestor
      $activeCampuses = getActiveCampuses
      $oruAncestors = getOruAncestors
      $campusJournals = getJournalsPerCampus    # Used for browse pages

      #####################################################################
      # STATISTICS
      # These are dependent on instantation of $activeCampuses

      # HOME PAGE statistics
      # ToDo:
      $statsViews = countViews
      $statsDownloads = countDownloads
      $statsOpenItems = countOpenItems
      $statsOrus = countOrus
      $statsItems =  countItems
      $statsThesesDiss = countThesisDiss
      $statsBooks = countBooks
      $statsEscholJournals = countEscholJournals
      $statsStudentJournals = countStudentJournals

      # BROWSE PAGE statistics
      $statsCampusPubs = getPubStatsPerCampus
      $statsCampusOrus = getOruStatsPerCampus
      $statsCampusJournals = getJournalStatsPerCampus
      $cachesFilled.set
      prevTime = utime
    end
    sleep 30
  end
}
$cachesFilled.wait

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
# Simple up-ness check
get "/check" do
  return "ok"
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
get %r{/assets/([0-9a-f]{64})} do |hash|
  s3Path = "#{$s3Config.prefix}/binaries/#{hash[0,2]}/#{hash[2,2]}/#{hash}"
  obj = $s3Bucket.object(s3Path)
  obj.exists? or halt(404)
  Tempfile.open("s3_", TEMP_DIR) { |s3Tmp|
    obj.get(response_target: s3Tmp)
    s3Tmp.seek(0)
    etag hash
    send_file(s3Tmp,
              last_modified: obj.last_modified,
              type: obj.metadata["mime_type"] || "application/octet-stream",
              filename: (obj.metadata["original_path"] || "").sub(%r{.*/}, ''))
    s3Tmp.unlink
  }
end

###################################################################################################
class S3Fetcher
  class S3Passer
    def initialize(queue, fifoPath)
      @queue = queue
      @fifoPath = fifoPath
      @fifo = nil
    end
    def write(chunk)
      if !@fifo and @fifoPath
        @fifo = File.open(@fifoPath, "wb")
      end
      @fifo ? @fifo.write(chunk) : @queue.push(chunk)
    end
    def close()
      @queue << nil
      @fifo and @fifo.close
    end
  end

  def initialize(s3Obj, fifoPath = nil, range = nil)
    @queue = QueueWithTimeout.new
    Thread.new do
      begin
        passer = S3Passer.new(@queue, fifoPath)
        if range
          s3Obj.get(response_target: passer, range: range)
        else
          s3Obj.get(response_target: passer)
        end
        passer.close
      rescue Exception => e
        puts "S3 fetch exception: #{e}"
      ensure
        @queue << nil  # mark end-of-data
      end
    end
  end

  def streamTo(out)
    begin
      totalStreamed = 0
      while true
        data = @queue.pop_with_timeout(10)
        data.nil? and break
        totalStreamed += data.length
        data.length > 0 and out << data
      end
      return totalStreamed
    rescue Exception => e
      puts "Warning: problem while streaming S3 content: #{e.message}"
      raise
    end
  end
end

###################################################################################################
get "/content/:fullItemID/*" do |itemID, path|
  # Prep work
  itemID =~ /^qt[a-z0-9]{8}$/ or halt(404)  # protect against attacks
  item = Item[itemID] or halt(404)
  item.status == 'published' or halt(403)  # prevent access to embargoed and withdrawn files
  path = sanitizeFilePath(path)  # protect against attacks

  # Figure out the ID in Merritt. eSchol items just use the eSchol ARK; others are recorded
  # as local IDs in the attributes.
  mrtID = "ark:/13030/#{itemID}"
  attrs = JSON.parse(item.attrs)
  (attrs["local_ids"] || []).each { |localID|
    localID["type"] == "merritt" and mrtID = localID["id"]
  }

  # If it's the main content PDF...
  if path =~ /^qt\w{8}\.pdf$/
    epath = "content/#{URI::encode(path)}"
    attrs["content_merritt_path"] and epath = attrs["content_merritt_path"]
    noSplash = !($host =~ /pub-jschol/) ||
               (params[:nosplash] && isValidContentKey(itemID.sub(/^qt/, ''), params[:nosplash]))
    mainPDF = true
  else
    # Must be a supp file.
    attrs["supp_files"] or halt(404)
    epath = nil
    attrs["supp_files"].each { |supp|
      if path == "supp/#{supp["file"]}"
        epath = supp["merritt_path"] || "content/#{URI::encode(path)}"
      end
    }
    epath or halt(404)
    noSplash = true
    mainPDF = false
  end

  # Guess the content type by path for now
  content_type MimeMagic.by_path(path)

  # Here's the final Merritt URL
  mrtURL = "https://#{$mrtExpressConfig['host']}/dl/#{mrtID}/#{epath}"

  # Stream supp files out directly from Merritt without local caching.
  if !mainPDF
    fetcher = MerrittFetcher.new(mrtURL)
    headers "Content-Length" => fetcher.length.to_s
    return stream { |out| fetcher.streamTo(out) }
  end

  # For the main PDF, check the cache of display PDFs.
  displayPDF = DisplayPDF[itemID]
  displayPDF or send_file $merrittCache.fetch(mrtURL) # fallback to orig PDF if no display ver

  if noSplash
    s3Path = "#{$s3Config.prefix}/pdf_patches/linearized/#{itemID}"
    outLen = displayPDF.linear_size
  else
    s3Path = "#{$s3Config.prefix}/pdf_patches/splash/#{itemID}"
    outLen = displayPDF.splash_size
  end

  # So we have to explicitly tell the client. With this, pdf.js will show the first page
  # before downloading the entire file.
  headers "Accept-Ranges" => "bytes"

  # Stream the file from S3
  s3Obj = $s3Bucket.object(s3Path)
  s3Obj.exists? or raise("missing S3 display PDF")
  range = request.env["HTTP_RANGE"]
  fetcher = S3Fetcher.new(s3Obj, nil, range)
  if range
    range =~ /^bytes=(\d+)-(\d+)/ or raise("can't parse range")
    fromByte, toByte = $1.to_i, $2.to_i
    puts "range #{fromByte}-#{toByte}/#{outLen}"
    headers "Content-Range" => "bytes #{fromByte}-#{toByte}/#{outLen}"
    outLen = toByte - fromByte + 1
    status 206
  end
  headers "Content-Length" => outLen.to_s,
          "ETag" => s3Obj.etag,
          "Last-Modified" => s3Obj.last_modified.to_s
  stream { |out| fetcher.streamTo(out) }
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
  pass if request.path_info =~ %r{api/.*|content/.*|locale/.*|.*\.\w{1,4}}

  puts "Page fetch: #{request.url}"

  template = File.new("app/app.html").read

  # Replace startup URLs for proper cache busting
  # TODO: speed this up by caching (if it's too slow)
  webpackManifest = JSON.parse(File.read('app/js/manifest.json'))
  template.sub!("lib-bundle.js", webpackManifest["lib.js"])
  template.sub!("app-bundle.js", webpackManifest["app.js"])
  template.sub!("main.css", "main-#{Digest::MD5.file("app/css/main.css").hexdigest[0,16]}.css")

  if DO_ISO
    # Parse out payload of the URL (i.e. not including the host name)
    request.url =~ %r{^https?://([^/:]+)(:\d+)?(.*)$} or fail
    remainder = $3

    # Pass the full path and query string to our little Node Express app, which will run it through
    # ReactRouter and React.
    response = Net::HTTP.new($host, 4002).start {|http| http.request(Net::HTTP::Get.new(remainder)) }
    status response.code.to_i

    # Read in the template file, and substitute the results from React/ReactRouter
    lookFor = '<div id="main"></div>'
    template.include?(lookFor) or raise("can't find #{lookFor.inspect} in template")
    return template.sub(lookFor, response.body)
  else
    # Development mode - skip iso
    return template
  end
end

###################################################################################################
# Pages with no data
get %r{/api/(home|notFound|logoutSuccess)} do
  content_type :json
  unit = $unitsHash['root']
  body = {
    :header => getGlobalHeader,
    :unit => unit.values.reject{|k,v| k==:attrs},
    :sidebar => getUnitSidebar(unit)
  }.to_json
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
    a << {"id" => unit.id, "name" => unit.name, "directSubmit" => unitAttrs['directSubmit']} unless unit.type != 'oru'
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
  os = children ? children.select { |u| u.unit.type == 'series' }.map {|u|
   unitAttrs = JSON.parse(u.unit.attrs)
   {'id': u.unit_id, 'name': u.unit.name, 'directSubmit': unitAttrs['directSubmit']}
  } : []
  return os ? os.sort_by{ |u| u[:name] }.to_json : nil
end

###################################################################################################
# Browse all campuses
get "/api/browse/campuses" do 
  content_type :json
  # Build array of hashes containing campus and stats
  stats = []
  $activeCampuses.each do |k, v|
    pub_count =     ($statsCampusPubs.keys.include? k)  ? $statsCampusPubs[k]     : 0
    unit_count =    ($statsCampusOrus.keys.include? k)  ? $statsCampusOrus[k]     : 0
    journal_count = ($statsCampusJournals.keys.include? k) ? $statsCampusJournals[k] : 0
    stats.push({"id"=>k, "name"=>v.values[:name], "type"=>v.values[:type], 
      "publications"=>pub_count, "units"=>unit_count, "journals"=>journal_count})
  end
  unit = $unitsHash['root']
  body = {
    :header => getGlobalHeader,
    :unit => unit.values.reject{|k,v| k==:attrs},
    :sidebar => getUnitSidebar(unit),
    :browse_type => "campuses",
    :campusesStats => stats.select { |h| h['type']=="campus" },
    :affiliatedStats => stats.select { |h| h['type']=="oru" }
  }
  breadcrumb = [{"name" => "Campuses and Other Locations", "url" => "/campuses"},]
  return body.merge(getHeaderElements(breadcrumb, nil)).to_json
end

###################################################################################################
# Browse all journals
get "/api/browse/journals" do 
  content_type :json
  journals = $campusJournals.sort_by{ |h| h[:name].downcase }
  unit = $unitsHash['root']
  body = {
    :header => getGlobalHeader,
    :unit => unit.values.reject{|k,v| k==:attrs},
    :sidebar => getUnitSidebar(unit),
    :browse_type => "all_journals",
    :journals => journals.select{ |h| h[:status]!="archived" },
    :archived => journals.select{ |h| h[:status]=="archived" }
  }
  breadcrumb = [{"name" => "Journals", "url" => "/journals"},]
  return body.merge(getHeaderElements(breadcrumb, "All Campuses")).to_json
end

###################################################################################################
# Browse a campus's units or journals
get "/api/browse/:browse_type/:campusID" do |browse_type, campusID|
  content_type :json
  cu, cj, pageTitle = nil, nil, nil
  if browse_type == 'units'
    cu = $hierByAncestor[campusID].map do |a| getChildDepts($unitsHash[a.unit_id]); end
    pageTitle = "Academic Units"
  else   # journals
    cj  = $campusJournals.select{ |j| j[:ancestor_unit].include?(campusID) }.sort_by{ |h| h[:name].downcase }
    cja = cj.select{ |h| h[:status]=="archived" }
    cj  = cj.select{ |h| h[:status]!="archived" }
    pageTitle = "Journals"
  end
  unit = $unitsHash[campusID]
  body = {
    :browse_type => browse_type,
    :pageTitle => pageTitle,
    :unit => unit ? unit.values.reject { |k,v| k==:attrs } : nil,
    :header => unit ? getUnitHeader(unit) : getGlobalHeader,
    :sidebar => getUnitSidebar(unit),
    :campusUnits => cu ? cu.compact : nil,
    :campusJournals => cj,
    :campusJournalsArchived => cja
  }
  breadcrumb = [
    {"name" => pageTitle, "url" => "/" + campusID + "/" + browse_type},
    {"name" => unit.name, "url" => "/uc/" + campusID}]
  return body.merge(getHeaderElements(breadcrumb, nil)).to_json
end

# Returns an array like [{"id"=>"uceap", "name"=>"UCEAP Mexico", "children" => []}, ...]
def getChildDepts(unit)
  if unit.type != 'oru'
    return nil
  else
    node = {"id" => unit.id, "name" => unit.name}
    child = $hierByAncestor[unit.id].map { |c| getChildDepts($unitsHash[c.unit_id]) }.compact
    if child[0] then node["children"] = child end
    return node
  end
end


###################################################################################################
# Unit page data. 
# pageName may be some designated function (nav, profile), specific journal volume, or static page name
get "/api/unit/:unitID/:pageName/?:subPage?" do
  content_type :json
  unit = Unit[params[:unitID]]
  unit or jsonHalt(404, "Unit not found")

  attrs = JSON.parse(unit[:attrs])
  pageName = params[:pageName]
  issueData = nil
  if pageName
    ext = nil
    begin
      ext = extent(unit.id, unit.type)
    rescue Exception => e
      puts "Error building page data: #{e} #{e.backtrace}"
      jsonHalt 404, "Error building page data:" + e.message
    end
    pageData = {
      unit: unit.values.reject{|k,v| k==:attrs}.merge(:extent => ext),
      sidebar: getUnitSidebar(unit)
    }
    if ["home", "search"].include? pageName
      q = nil
      q = CGI::parse(request.query_string) if pageName == "search"
      pageData[:content] = getUnitPageContent(unit, attrs, q)
      if unit.type == 'journal' and pageData[:content][:issue]
        # need this information for building header breadcrumb
        issueData = {'unit_id': params[:unitID],
                     'volume': pageData[:content][:issue][:volume],
                     'issue': pageData[:content][:issue][:issue]}
      end
    elsif pageName == 'profile'
      pageData[:content] = getUnitProfile(unit, attrs)
    elsif pageName == 'carousel' 
      # ToDo: Cleanup this which duplicates marquee info below
      pageData[:content] = getUnitCarouselConfig(unit, attrs)
    elsif pageName == 'issueConfig'
      pageData[:content] = getUnitIssueConfig(unit, attrs)
    elsif pageName == 'nav'
      pageData[:content] = getUnitNavConfig(unit, attrs['nav_bar'], params[:subPage])
    elsif pageName == 'sidebar'
      pageData[:content] = getUnitSidebarWidget(unit, params[:subPage])
    elsif isJournalIssue?(unit.id, params[:pageName], params[:subPage])
      # A specific issue, otherwise you get journal landing (through getUnitPageContent method above)
      issueData = {'unit_id': params[:unitID], 'volume': params[:pageName], 'issue': params[:subPage]}
      pageData[:content] = getJournalIssueData(unit, attrs, params[:pageName], params[:subPage])
    else
      pageData[:content] = getUnitStaticPage(unit, attrs, pageName)
    end
    pageData[:header] = getUnitHeader(unit,
                                      (pageName =~ /^(nav|sidebar|profile|carousel|issueConfig)/ or issueData) ? nil : pageName,
                                      issueData, attrs)
    pageData[:marquee] = getUnitMarquee(unit, attrs) if (["home", "search"].include? pageName or issueData)
  else
    #public API data
    pageData = {
      unit: unit.values.reject{|k,v| k==:attrs}
    }
  end
  return pageData.to_json
end

###################################################################################################
def calcContentKey(shortArk, date = nil)
  Digest::MD5.hexdigest("V01:#{shortArk}:#{(date || Date.today).iso8601}:#{$jscholKey}")
end

###################################################################################################
def isValidContentKey(shortArk, key)
  (-1..1).each { |offset|
    if key == calcContentKey(shortArk, Date.today + offset)
      return true
    end
  }
  return false
end

###################################################################################################
# Item view page data.
get "/api/item/:shortArk" do |shortArk|
  content_type :json
  id = "qt"+shortArk
  item = Item[id]
  attrs = JSON.parse(Item.filter(:id => id).map(:attrs)[0])
  unitIDs = UnitItem.where(:item_id => id, :is_direct => true).order(:ordering_of_units).select_map(:unit_id)
  unit = unitIDs ? Unit[unitIDs[0]] : nil

  if !item.nil?
    authors = ItemAuthors.filter(:item_id => id).order(:ordering).
                 map(:attrs).collect{ |h| JSON.parse(h)}
    citation = getCitation(shortArk, authors, attrs)
    begin
      body = {
        :id => shortArk,
        :citation => citation,
        :title => citation[:title],
        # ToDo: Normalize author attributes across all components (i.e. 'family' vs. 'lname')
        :authors => authors,
        :pub_date => item.pub_date,
        :status => item.status,
        :rights => item.rights,
        :content_type => item.content_type,
        :content_html => getItemHtml(item.content_type, shortArk),
        :content_key => calcContentKey(shortArk),
        :attrs => attrs,
        :sidebar => unit ? getItemRelatedItems(unit, id) : nil,
        :appearsIn => unitIDs ? unitIDs.map { |unitID| {"id" => unitID, "name" => Unit[unitID].name} }
                              : nil,
        :unit => unit ? unit.values.reject { |k,v| k==:attrs } : nil,
        :usage => ItemCount.where(item_id: id).order(:month).to_hash(:month).map { |m,v| { "month"=>m, "hits"=>v.hits, "downloads"=>v.downloads }},
        :altmetrics_ok => false
      }

      if unit
        if unit.type != 'journal'
          body[:header] = getUnitHeader(unit)
          body[:altmetrics_ok] = true
        else 
          body[:altmetrics_ok] = JSON.parse(unit[:attrs])['altmetrics_ok']
          issue_id = Item.join(:sections, :id => :section).filter(Sequel.qualify("items", "id") => id).map(:issue_id)[0]
          unit_id, volume, issue = Section.join(:issues, :id => issue_id).map([:unit_id, :volume, :issue])[0]
          body[:header] = getUnitHeader(unit, nil, {'unit_id': unit_id, 'volume': volume, 'issue': issue})
          body[:citation][:volume] = volume
          body[:citation][:issue] = issue
        end
      end

      return body.to_json
    rescue Exception => e
      puts "Error in item API:"
      pp e
      halt 404, e.message
    end
  else 
    puts "Item not found!"
    halt 404, "Item not found"
  end
end

###################################################################################################
# Item Metrics 
get "/api/item/metrics" do |shortArk|
  content_type :json
  id = "qt"+shortArk
  item = Item[id]
  # ItemCounts 

  # Example python code from EZID:
  # all_months = _computeMonths(table)
  # if len(all_months) > 0:
  #  d["totals"] = _computeTotals(table)
  #  month_earliest = table[0][0]
  #  month_latest = "%s-%s" % (datetime.now().year, datetime.now().month)
  #  d['months_all'] = [m[0] for m in table]
  #  default_table = table[-12:]
  #  d["month_from"] = REQUEST["month_from"] if "month_from" in REQUEST else default_table[0][0]
  #  d["month_to"] = REQUEST["month_to"] if "month_to" in REQUEST else default_table[-1][0]
  #  d["totals_by_month"] = _computeMonths(_getScopedRange(table, d['month_from'], d['month_to']))
  return {} 
end

###################################################################################################
# Search page data
get "/api/search/" do
  content_type :json
  body = {
    :header => getGlobalHeader,
    :campuses => getCampusesAsMenu
  }
  facetList = ['type_of_work', 'peer_reviewed', 'supp_file_types', 'pub_year',
               'campuses', 'departments', 'journals', 'disciplines', 'rights']
  params = CGI::parse(request.query_string)
  searchType = params["searchType"][0]
  # Perform global search when searchType is assigned 'eScholarship'
  # otherwise: 'searchType' will be assigned the unit ID - and then 'searchUnitType' specifies type of unit.
  if searchType and searchType != "eScholarship"
    searchUnitType = params["searchUnitType"][0]
    if searchUnitType.nil? or searchUnitType == ''
      params["searchType"] = ["eScholarship"]
    else
      params[searchUnitType] = [searchType]
    end
  end
  return body.merge(search(params, facetList)).to_json
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
  sharedLink = "http://www.escholarship.org/" + path + "/" + id 
  case service
    when "facebook"
      url = "http://www.facebook.com/sharer.php?u=" + sharedLink
    when "twitter"
      url = "http://twitter.com/home?status=" + title + "[" + sharedLink + "]"
    when "email"
      title_sm = title.length > 50 ? title[0..49] + "..." : title
      body = ''
      if (type == "item")
        # ToDo: Put in proper citation
        body = (item.attrs["orig_citation"] ? item.attrs["orig_citation"] + "\n\n" : "")
      else
        body = "View items by " + title + " published on eScholarship.\n\n" 
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
  $activeCampuses.each do |id, c| campuses << {id: c.id, name: c.name} end
  return campuses.unshift({:id => "", :name=>topItem})
end

def getCampusId(unit)
  r = UnitHier.where(unit_id: unit.id).where(ancestor_unit: $activeCampuses.keys).first
  return (unit.type=='campus') ? unit.id : r ? r.ancestor_unit : 'root'
end

# Properly target links in HTML blob
def getItemHtml(content_type, id)
  return false if content_type != "text/html"
  dir = "http://" + request.env["HTTP_HOST"] + "/content/qt" + id + "/"
  htmlStr = open(dir + "qt" + id + ".html").read
  htmlStr.gsub(/(href|src)="((?!#)[^"]+)"/) { |m|
    attrib, url = $1, $2
    url = $2.start_with?("http", "ftp") ? $2 : dir + $2
    "#{attrib}=\"#{url}\"" + ((attrib == "src") ? "" : " target=\"new\"")
  }
end

###################################################################################################
# Static page data.
get "/api/static/:unitID/:pageName" do |unitID, pageName|
  content_type :json

  # Grab unit and page data from the database, not the cache, so they are instantly updated
  # when adding a page.
  unit = Unit[unitID]
  unit or halt(404, "Unit not found")

  page = Page.where(unit_id: unitID, name: pageName).first
  page or halt(404, "Page not found")

  body = {
    header: unitID=='root' ? getGlobalHeader : getUnitHeader(unit),
    campuses: getCampusesAsMenu,
    page: {
      title: page.title,
      html: JSON.parse(page.attrs)['html']
    },
    sidebarWidgets: Widget.where(unit_id: unitID, region: 'sidebar').order(:ordering).map { |w|
      attrs = w.attrs ? JSON.parse(w.attrs) : {}
      { id: w.id,
        kind: w.kind,
        title: attrs['title'] ? attrs['title'] : w.kind,
        html: attrs['html'] ? attrs['html'] :
                "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Labore, saepe fugiat nihil molestias quam fugit harum suscipit, soluta debitis praesentium. Minus repudiandae debitis non dolore dignissimos, aliquam corporis ratione, quasi." }
    },
    sidebarNavLinks: [{"name" => "About eScholarship", "url" => request.path.sub("/api/", "/")},]
  }
  breadcrumb = [{"name" => "About eScholarship", "url" => request.path.sub("/api/", "/")},]
  return body.merge(getHeaderElements(breadcrumb, nil)).to_json
end

###################################################################################################
# Post from github notifying us of a push to the repo
post "/jscholGithubHook/onCommit" do
  puts "Got github commit hook - doing pull and restart."
  pid = spawn("/usr/bin/ruby tools/pullJschol.rb > /apps/eschol/tmp/pullJschol.log 2>&1")
  Process.detach(pid)
  return "ok"
end
