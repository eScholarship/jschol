# Sample application foundation for eschol5 - see README.md for more info

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

###################################################################################################
# External gems we need
require 'cgi'
require 'digest'
require 'json'
require 'net/http'
require 'pp'
require 'sequel'
require 'sinatra'
require 'sinatra/reloader' if development?
require 'sinatra/cookies'
require 'unindent'
require 'yaml'

# Sinatra configuration
configure do
  # Don't use Webrick, as sinatra-websocket requires 'thin', and 'thin' is better anyway.
  set :server, 'thin'
  # We like to use the 'app' folder for all our static resources
  set :public_folder, Proc.new { root }
end

# Flush stdout after each write, which makes debugging easier.
STDOUT.sync = true

###################################################################################################
# Use the Sequel gem to get object-relational mapping, connection pooling, thread safety, etc.
DB = Sequel.connect(YAML.load_file("config/database.yaml"))

###################################################################################################
# Model classes for easy interaction with the database.
#
# For more info on the database schema, see contents of migrations/ directory, and for a more
# graphical version, see:
#
# https://docs.google.com/drawings/d/1gCi8l7qteyy06nR5Ol2vCknh9Juo-0j91VGGyeWbXqI/edit

class Unit < Sequel::Model
  unrestrict_primary_key
end

class UnitHier < Sequel::Model(:unit_hier)
  unrestrict_primary_key
end

class Item < Sequel::Model
  unrestrict_primary_key
end

class UnitItem < Sequel::Model
  unrestrict_primary_key
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
# the appropriate React templates, and returns us the HTML. See 
#
# In this way, the user gets a speedy initial load, can use some of the site features without
# javascript, and crawlers have an easy time seeing everything the users see.
###################################################################################################

###################################################################################################
def isoFetch(request, pageName, initialData)
  puts "FIXME: Skipping isoFetch for now."
  return ""

  # We need to grab the hostname from the URL. There's probably a better way to do this.
  request.url =~ %r{^https?://([^/:]+)} or fail
  host = $1

  # Post the initial data to our little Node Express app, which will run it through React.
  req = Net::HTTP::Post.new("/#{pageName}", initheader = {'Content-Type' =>'application/json'})
  req.body = initialData.to_json
  response = Net::HTTP.new(host, 4002).start {|http| http.request(req) }
  response.code == "200" or fail

  # Return the resulting HTML
  return response.body
end

###################################################################################################
# The outer framework of every page is essentially the same, with tiny variations.
def genAppPage(title, request, initialData)
  # A bit of obtuse parsing to figure out the name of the page being requested.
  root = request.path_info.gsub(%r{[^/]+}, '..').sub(%r{^/../..}, '../').sub(%r{/..}, '')
  pageName = request.path_info.sub(%r{^/}, '').sub(%r{/.*$}, '')

  # Read in the template file.
  template = File.new("app/demo.html").read

  # Do isomorphic substitution
  return template.sub("<div id=\"main\"></div>",  
                      "<div id=\"main\">#{isoFetch(request, pageName, initialData)}</div>")
end

###################################################################################################
# Unit landing page. After the slash is the unit_id.
get "/unit/:unitID" do |unitID|
  unit = Unit[unitID]
  
  # Initial data for the page consists of the unit's id, name, type, etc. plus lists of the unit's
  # children and parents drawn from the unit_hier database table. Remember that "direct" links are
  # direct parents and children. "Indirect" (which we don't use here) are for grandparents/ancestors,
  # and grand-children/descendants.
  items = UnitItem.filter(:unit_id => unitID, :is_direct => true)
  genAppPage("Unit landing page", request, { })
end

###################################################################################################
get "/api/unit/:unitID" do |unitID|
  # Initial data for the page consists of the unit's id, name, type, etc. plus lists of the unit's
  # children and parents drawn from the unit_hier database table. Remember that "direct" links are
  # direct parents and children. "Indirect" (which we don't use here) are for grandparents/ancestors,
  # and grand-children/descendants.
  content_type :json
  unit = Unit[unitID]
  items = UnitItem.filter(:unit_id => unitID, :is_direct => true)
  return {
    :id => unitID,
    :name => unit.name,
    :type => unit.type,
    :parents => UnitHier.filter(:unit_id => unitID, :is_direct => true).map { |hier| hier.ancestor_unit },
    :children => UnitHier.filter(:ancestor_unit => unitID, :is_direct => true).map { |hier| hier.unit_id },
    :nItems => items.count,
    :items => items.limit(10).map { |pair| pair.item_id }
  }.to_json
end

###################################################################################################
# Item view page.
get "/api/item/:shortArk" do |shortArk|
  # Andy, hack here.
  content_type :json
  item = Item["qt"+shortArk]
  return { 
    :id => shortArk,
    :title => item.title,
    :rights => item.rights,
    :pub_date => item.pub_date
  }.to_json
end
