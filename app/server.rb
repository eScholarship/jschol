# Sample application foundation for eschol5 - see README.md for more info

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

###################################################################################################
# External gems we need
require 'cgi'
require 'digest'
require 'json'
require 'mimemagic'
require 'net/http'
require 'open-uri'
require 'pp'
require 'sequel'
require 'sinatra'
require 'sinatra/streaming'
require 'yaml'
require 'socksify'
require 'socket'

# Use the Sequel gem to get object-relational mapping, connection pooling, thread safety, etc.
# If specified, use SOCKS proxy for all connections (including database).
dbConfig = YAML.load_file("config/database.yaml")
if File.exist? "config/socks.yaml"
  # Configure socksify for all TCP connections. Jump through hoops for MySQL to use it too.
  TCPSocket::socks_server = "127.0.0.1"
  TCPSocket::socks_port = YAML.load_file("config/socks.yaml")['port']
  require_relative 'socksMysql'
  SocksMysql.reconfigure(dbConfig)
end
DB = Sequel.connect(dbConfig)

# Internal modules to implement specific pages and functionality
require_relative 'breadcrumb'
require_relative 'searchApi'
require_relative 'queueWithTimeout'

# Sinatra configuration
configure do
  # Don't use Webrick, as sinatra-websocket requires 'thin', and 'thin' is better anyway.
  set :server, 'thin'
  # We like to use the 'app' folder for all our static resources
  set :public_folder, Proc.new { root }

  set :show_exceptions, false
end

# For general app development, set DO_ISO to false. For real deployment, set to true
DO_ISO = false

# Make puts thread-safe, and flush after every puts.
$stdoutMutex = Mutex.new
def puts(*args)
  $stdoutMutex.synchronize { 
    super(*args)
    STDOUT.flush
  }
end

###################################################################################################
# Model classes for easy interaction with the database.
#
# For more info on the database schema, see contents of migrations/ directory, and for a more
# graphical version, see:
#
# https://docs.google.com/drawings/d/1gCi8l7qteyy06nR5Ol2vCknh9Juo-0j91VGGyeWbXqI/edit

class Issue < Sequel::Model
end

class Item < Sequel::Model
  unrestrict_primary_key
end

class ItemAuthor < Sequel::Model
  unrestrict_primary_key
end

class Unit < Sequel::Model
  unrestrict_primary_key
end

class UnitHier < Sequel::Model(:unit_hier)
  unrestrict_primary_key
end

class UnitItem < Sequel::Model
  unrestrict_primary_key
end

class Section < Sequel::Model
end

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
  path = path.gsub(/[^-a-zA-Z0-9_.\/]/, '_').split("/").map { |part|
    part.sub(/^\.+/, '_').sub(/\.+$/, '_')
  }.join('/')
end

###################################################################################################
class Fetcher
  def start(uri)
    # We have to fetch the file in a different thread, because it needs to keep the HTTP request
    # open in that thread while we return the status code to Sinatra. Then the remaining data can
    # be streamed from the thread to Sinatra.
    puts "Content fetch: #{uri}."
    @queue = QueueWithTimeout.new
    Thread.new do
      begin
        # Now jump through Net::HTTP's hijinks to actually fetch the file.
        Net::HTTP.start(uri.host, uri.port, :use_ssl => (uri.scheme == 'https')) do |http|
          http.request(Net::HTTP::Get.new uri.request_uri) do |response|
            @queue << [response.code, response.message]
            if response.code == "200"
              response.read_body { |chunk| @queue << chunk }
            else
              puts "Error: Response to #{uri} was HTTP #{response.code}: #{response.message.inspect}"
            end
          end
        end
      ensure
        @queue << nil  # mark end-of-data
      end
    end

    # Wait for the status code to come back from the fetch thread.
    code, msg = @queue.pop_with_timeout(60)
    return code.to_i, msg
  end

  # Now we're ready to set the content type and return the contents in streaming fashion.
  def copyTo(out)
    while true
      data = @queue.pop_with_timeout(10)
      data.nil? and break
      out.write(data)
    end
  end
end

###################################################################################################
get "/content/:fullItemID/*" do |fullItemID, path|
  # Prep work
  fullItemID =~ /^qt[a-z0-9]{8}$/ or halt(404)  # protect against attacks
  item = Item[fullItemID]
  item.status == 'published' or halt(403)  # prevent access to embargoed and withdrawn files
  path = sanitizeFilePath(path)  # protect against attacks

  # Fetch the file from Merritt
  fetcher = Fetcher.new
  code, msg = fetcher.start(URI("http://mrtexpress.cdlib.org/dl/ark:/13030/#{fullItemID}/content/#{path}"))

  # Temporary fallback: if we can't find on Merritt, try the raw_data hack on pub-eschol-stg.
  # This is needed for ETDs, since we don't yet record their proper original Merritt location.
  if code != 200
    fetcher = Fetcher.new
    code2, msg2 = fetcher.start(URI("http://pub-eschol-stg.escholarship.org/raw_data/13030/pairtree_root/" +
                                    "#{fullItemID.scan(/../).join('/')}/#{fullItemID}/content/#{path}"))
    code2 == 200 or halt(code, msg)
  end

  # Guess the content type by path for now, and stream the results (don't buffer the whole thing,
  # as some files are huge and would blow out our RAM).
  content_type MimeMagic.by_path(path)
  return stream { |out| fetcher.copyTo(out) }
end

###################################################################################################
# The outer framework of every page is essentially the same, substituting in the intial page
# data and initial elements from React.
get %r{^/(?!api/)(?!content/).*} do  # matches every URL except /api/* and /content/*

  puts "Page fetch: #{request.url}"

  if DO_ISO
    # We need to grab the hostname from the URL. There's probably a better way to do this.
    request.url =~ %r{^https?://([^/:]+)(:\d+)?(.*)$} or fail
    host = $1
    remainder = $3

    # Pass the full path and query string to our little Node Express app, which will run it through 
    # ReactRouter and React.
    response = Net::HTTP.new(host, 4002).start {|http| http.request(Net::HTTP::Get.new(remainder)) }
    response.code == "200" or halt(500, "ISO fetch failed")

    # Read in the template file, and substitute the results from React/ReactRouter
    template = File.new("app/app.html").read
    lookFor = '<div id="main"/>'
    template.include?(lookFor) or raise("can't find #{lookFor.inspect} in template")
    return template.sub(lookFor, response.body)
  else
    # Development mode - skip iso
    return File.new("app/app.html").read
  end
end

###################################################################################################
# Unit page data.
get "/api/unit/:unitID" do |unitID|
  # Initial data for the page consists of the unit's id, name, type, etc. plus lists of the unit's
  # children and parents drawn from the unit_hier database table. Remember that "direct" links are
  # direct parents and children. "Indirect" (which we don't use here) are for grandparents/ancestors,
  # and grand-children/descendants.
  content_type :json
  unit = Unit[unitID]
  if !unit.nil?
    begin
      items = UnitItem.filter(:unit_id => unitID, :is_direct => true)
      body = {
        :id => unitID,
        :name => unit.name,
        :type => unit.type,
        :parents => UnitHier.filter(:unit_id => unitID, :is_direct => true).map { |hier| hier.ancestor_unit },
        :children => UnitHier.filter(:ancestor_unit => unitID, :is_direct => true).map { |hier| hier.unit_id },
        :nItems => items.count,
        :items => items.limit(10).map { |pair| pair.item_id }
      }
      return body.merge(getHeaderElements(BreadcrumbGenerator.new(unitID, 'unit'))).to_json
    rescue Exception => e
      halt 404, e.message
    end
  else
    halt 404, "Unit not found"
  end
end

###################################################################################################
# Item view page data.
get "/api/item/:shortArk" do |shortArk|
  content_type :json
  id = "qt"+shortArk
  item = Item[id]
  if !item.nil?
    begin
      body = {
        :id => shortArk,
        :status => item.status,
        :title => item.title,
        :rights => item.rights,
        :pub_date => item.pub_date,
        :authors => ItemAuthor.filter(:item_id => id).order(:ordering).
                               map(:attrs).collect{ |h| JSON.parse(h)["name"]},
        :content_type => item.content_type,
        :content_html => getItemHtml(shortArk),
        :attrs => JSON.parse(Item.filter(:id => id).map(:attrs)[0])
      }
      return body.merge(getHeaderElements(BreadcrumbGenerator.new(shortArk, 'item'))).to_json
    rescue Exception => e
      halt 404, e.message
    end
  else 
    halt 404, "Item not found"
  end
end

###################################################################################################
# Search page data
get "/api/search/" do
  # Amy, hack here
  content_type :json
  return search(CGI::parse(request.query_string)).to_json
end

###################################################################################################
# Social Media Links 
get "/api/mediaLink/:shortArk/:service" do |shortArk, service| # service e.g. facebook, google, etc.
  content_type :json
  sharedLink = "http://www.escholarship.com/item/" + shortArk
  item = Item["qt"+shortArk]
  title = item.title
  case service
    when "facebook"
      url = "http://www.facebook.com/sharer.php?u=" + sharedLink
    when "twitter"
      url = "http://twitter.com/home?status=" + title + "[" + sharedLink + "]"
    when "email"
      title_sm = title.length > 50 ? title[0..49] + "..." : title
      url = "mailto:?subject=" + title_sm + "&body=" +
        # ToDo: Put in proper citation
        (item.attrs["orig_citation"] ? item.attrs["orig_citation"] + "\n\n" : "") +
        sharedLink 
    when "mendeley"
      url = "http://www.mendeley.com/import?url=" + sharedLink + "&title=" + title
    when "citeulike"
      url = "http://www.citeulike.org/posturl?url=" + sharedLink + "&title=" + title
  end
  return { url: url }.to_json
end

##################################################################################################
# Helper methods

# Generate breadcrumb and header content
def getHeaderElements(breadcrumb)
  campusID, campusName = breadcrumb.getCampusInfo
  return {
    :isJournal => breadcrumb.isJournal?,
    :campusID => campusID,
    :campusName => campusName,
    :campuses => ACTIVE_CAMPUSES,
    :breadcrumb => breadcrumb.generateCrumb,
    :appearsIn => breadcrumb.appearsIn 
  }
end

# Get all active campuses/ORUs (id and name), sorted alphabetically by name
def getActiveCampuses
  campuses = Unit.join(:unit_hier, :unit_id => :id).
                  filter(:ancestor_unit => 'root', :is_direct => 1, :is_active => true).
                  to_hash(:id, :name)
  sorted = campuses.sort_by { |id, name| name }
  return sorted.unshift(["", "eScholarship at..."])
end

# Properly target links in HTML blob
def getItemHtml(id)
  dir = "http://" + request.env["HTTP_HOST"] + "/content/qt" + id + "/"
  htmlStr = open(dir + "qt" + id + ".html").read
  htmlStr.gsub(/(href|src)="((?!#)[^"]+)"/) { |m|
    attrib, url = $1, $2
    url = $2.start_with?("http", "ftp") ? $2 : dir + $2
    "#{attrib}=\"#{url}\"" + ((attrib == "src") ? "" : " target=\"new\"")
  }
end

##################################################################################################
# Static Variables 

# Array of all campuses sorted by name (i.e. [["ucb", "UC Berkeley"], ... )
ACTIVE_CAMPUSES = getActiveCampuses

