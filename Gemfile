# Ruby gems required by this application
ruby '> 2.4.0'
source 'https://rubygems.org'
gem 'aws-sdk-s3'          # used to work with S3 bucket contents
gem 'aws-sdk-cloudsearch' # used to talk to AWS CloudSearch
gem 'aws-sdk-cloudsearchdomain' # used to talk to AWS CloudSearch
gem 'bundler'             # needed for use in Beanstalk environment
gem 'escape_utils'        # for warding away evil strings
gem 'fastimage'           # for determining dimensions of image files
gem 'htmlentities'        # for decoding HTML entites
gem 'httparty'            # for fetching URLs easily
gem 'json'                # safely and quickly parsing and generating JSON data
gem 'maxminddb-geolite2-city'  # for translating IP to city; note: updates stop in April
gem 'mail'                # for sending mass emails (e.g. stats)
gem 'mimemagic'           # for guessing mime types during conversion
gem 'mini_magick'         # cover thumbnail - image size reduction
gem 'mysql2'              # connecting to the database
gem 'netrc'               # used to read EZID credentials
gem 'nokogiri'            # parsing and generating XML
gem 'parslet'             # parser to transform search into Cloudsearch compound query
gem 'puma'                # Rack web service layer
gem 'puma_worker_killer'  # because mem leak has been so hard to find
gem 'rubocop'             # Rubocop for lint checking Ruby code
gem 'rubocop-sequel'      # Plugin for Rubocop to facilitate lint-checking Sequel-related code
gem 'sanitize'            # parse and sanitize user-supplied HTML fragments
gem 'sequel'              # object-relational mapper (including migrations)
gem 'sigdump', require: 'sigdump/setup' # to get thread traces with kill -CONT
gem 'sinatra'             # lightweight web framework
gem 'sinatra-websocket'   # web socket support for Sinatra
gem 'socksify'            # for proxying all TCP through SOCKS proxy
gem 'sqlite3'             # for local testing without remote Mysql database
gem 'test-unit'           # test/quick.rb
gem 'unindent'            # remove indentation from lines of a string
gem 'vmstat'              # for determining machine's RAM size to work around mem leak
gem 'xml-sitemap'         # generate Google sitemap
