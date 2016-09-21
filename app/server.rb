# Sample application foundation for eschol5 - see README.md for more info

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'
require_relative 'breadcrumb'

###################################################################################################
# External gems we need
require 'digest'
require 'json'
require 'net/http'
require 'pp'
require 'sequel'
require 'sinatra'
require 'yaml'
require 'cgi'


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

# Flush stdout after each write, which makes debugging easier.
STDOUT.sync = true

###################################################################################################
# Use the Sequel gem to get object-relational mapping, connection pooling, thread safety, etc.
DB = Sequel.connect(YAML.load_file("config/database.yaml"))
require_relative 'searchApi'

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
# The outer framework of every page is essentially the same, substituting in the intial page
# data and initial elements from React.
get %r{^/(?!api/).*} do  # matches every URL except /api/*

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
    return template.sub("<div id=\"main\"></div>", response.body)
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
  items = UnitItem.filter(:unit_id => unitID, :is_direct => true)
  b = BreadcrumbGenerator.new(unitID, 'unit')
  return {
    :id => unitID,
    :name => unit.name,
    :type => unit.type,
    :parents => UnitHier.filter(:unit_id => unitID, :is_direct => true).map { |hier| hier.ancestor_unit },
    :children => UnitHier.filter(:ancestor_unit => unitID, :is_direct => true).map { |hier| hier.unit_id },
    :nItems => items.count,
    :items => items.limit(10).map { |pair| pair.item_id },
    :breadcrumb => b.generate 
  }.to_json
end

###################################################################################################
# Item view page data.
get "/api/item/:shortArk" do |shortArk|
  # Andy, hack here.
  content_type :json
  item = Item["qt"+shortArk]
  b = BreadcrumbGenerator.new(shortArk, 'item')
  return { 
    :id => shortArk,
    :title => item.title,
    :rights => item.rights,
    :pub_date => item.pub_date,
    :breadcrumb => b.generate 
  }.to_json
end

###################################################################################################
# Search page data
get "/api/search/" do
  # Amy, hack here
  content_type :json
  return search(CGI::parse(request.query_string)).to_json
end
