#!/usr/bin/env ruby

# This script creates sitemaps for Google indexing
# As of this writing, this does not geenrate the index

# Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

require 'fileutils'
require 'sequel'
require 'yaml'
require 'xml-sitemap'

DEST_DIR = "app/sitemaps"
FileUtils.mkdir_p(DEST_DIR)

# eschol5 database
DB = Sequel.connect(YAML.load_file("config/database.yaml"))

Sequel::Model.db = DB
class Page < Sequel::Model
end

class Unit < Sequel::Model
end

class Item < Sequel::Model
end

def makeMap (filename, include_homepage=false)
  path = "#{DEST_DIR}" + '/' + filename
  map = XmlSitemap::Map.new('escholarship.org', :secure => true, :home => include_homepage)
  yield map 
  map.render_to(path)
end

# Build campus sitemap
makeMap('siteMapCampus.xml'){|map|
  Unit.filter(:type=>'campus').select(:id).each { |campus|
    map.add '/uc/' + campus.id, :priority => 0.7, :period => :weekly
  }
}

# Build journal sitemap
makeMap('siteMapJournal.xml'){|map|
  Unit.filter(:type=>'journal').exclude(status: "hidden").select(:id).each { |journal|
    map.add '/uc/' + journal.id, :priority => 0.7, :period => :weekly
  }
}

# Build ORU sitemap
makeMap('siteMapORU.xml'){|map|
  Unit.filter(:type=>'oru').exclude(status: "hidden").select(:id).each { |oru|
    map.add '/uc/' + oru.id, :priority => 0.7, :period => :weekly
  }
}

# ToDo: Build series sitemap

# ToDo: Build monograph_series sitemap

# Build static pages sitemap
makeMap('siteMapStatic.xml', true){|map|
  Page.each { |p|
    url = p.unit_id == 'root' ? "/" + p.slug : "/uc/#{p.unit_id}/" + p.slug
    map.add url
    # ToDo: I'd like to remove the <lastmod> element here but sure how to do it
  }
}

# Build items sitemap
ITEM_BUCKETS = 20
total_items = Item.where(status: 'published').count
batch_count = (total_items / ITEM_BUCKETS.to_f).ceil
offset = 0
index = 0
while offset < total_items + 1 do
  makeMap('siteMapItem-' + format('%02d', index) + '.xml'){|map|
    Item.where(status: 'published').select(:id, :last_indexed).limit(batch_count,offset).each { |item|
      map.add '/uc/item/' + item.id[/^qt(.*)$/, 1], :period => :monthly, :updated => item.last_indexed.to_s[/\d\d\d\d-\d\d-\d\d/]
    }
  } 
  offset += batch_count 
  index += 1
end


###################################################################################################
# This doesn't allow you to specify the filename of the file being indexed!
# def mapIndex()
  # index = XmlSitemap::Index.new(:secure => true)
  # index.add(map)     <-- API doesn't let you simply add a filepath here
  # index.render_to("#{DEST_DIR}" + '/siteMapIndex.xml')
# end
#
# Generates this:
# <?xml version="1.0" encoding="UTF-8"?>
#<sitemapindex xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/
#siteindex.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
#  <sitemap>
#    <loc>https://escholarship.org/sitemap-0.xml</loc>
#                                  ^^^^^^^^^  Not clear how to change filename here
#    <lastmod>2017-10-26T21:12:18Z</lastmod>
#  </sitemap>
#</sitemapindex>


