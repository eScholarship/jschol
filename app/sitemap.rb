require 'xml-sitemap'

ITEM_BUCKETS = 20

def makeSiteMap(homePage = false)
  content_type :xml
  map = XmlSitemap::Map.new('escholarship.org', :secure => true, :home => homePage)
  yield map 
  return map.render
end

# Build campus sitemap
get "/siteMapCampus.xml" do
  makeSiteMap {|map|
    Unit.filter(:type=>'campus').select(:id).each { |campus|
      map.add '/uc/' + campus.id, :priority => 0.7, :period => :weekly
    }
  }
end

# Build journal sitemap
get "/siteMapJournal.xml" do
  makeSiteMap {|map|
    Unit.filter(:type=>'journal').exclude(status: "hidden").select(:id).each { |journal|
      map.add '/uc/' + journal.id, :priority => 0.7, :period => :weekly
    }
  }
end

# Build ORU sitemap
get "/siteMapORU.xml" do
  makeSiteMap {|map|
    Unit.filter(:type=>'oru').exclude(status: "hidden").select(:id).each { |oru|
      map.add '/uc/' + oru.id, :priority => 0.7, :period => :weekly
    }
  }
end

# Build series sitemap
get "/siteMapSeries.xml" do
  makeSiteMap {|map|
    Unit.filter(:type=>'series').exclude(status: "hidden").select(:id).each { |series|
      map.add '/uc/' + series.id, :priority => 0.7, :period => :weekly
    }
  }
end

# Build monograph series sitemap
get "/siteMapMonographSeries.xml" do
  makeSiteMap {|map|
    Unit.filter(:type=>'monograph_series').exclude(status: "hidden").select(:id).each { |series|
      map.add '/uc/' + series.id, :priority => 0.7, :period => :weekly
    }
  }
end

# No seminar_series sitemap, says Justin.

# Build special sitemap
get "/siteMapSpecial.xml" do
  makeSiteMap {|map|
    Unit.filter(:type=>'special').exclude(status: "hidden").select(:id).each { |special|
      map.add '/uc/' + special.id, :priority => 0.7, :period => :weekly
    }
  }
end

# Build static and browse pages sitemap
get "/siteMapStatic.xml" do
  makeSiteMap(true){|map|
    # Home page taken care of  ^^^^ by passing argument 'true'
    # Browse pages
    map.add 'campuses'
    map.add 'journals'
    Unit.filter(:type=>'campus').exclude(:id=>['lbnl', 'anrcs']).select(:id).each { |campus|
      map.add '/' + campus.id + '/units'
    }
    Unit.filter(:type=>'campus').exclude(:id=>'lbnl').select(:id).each { |campus|
      map.add '/' + campus.id + '/journals'
    }
    # Static pages
    Page.each { |p|
      url = p.unit_id == 'root' ? "/" + p.slug : "/uc/#{p.unit_id}/" + p.slug
      map.add url
      # ToDo: I'd like to remove the <lastmod> element here but sure how to do it
    }
  }
end

# Build items sitemap
get %r{/siteMapItem-(\d\d).xml} do |pageNum|
  total_items = Item.where(status: ['published', 'embargoed']).count
  batch_count = (total_items / ITEM_BUCKETS.to_f).ceil
  index = pageNum.to_i
  offset = batch_count * index
  makeSiteMap {|map|
    Item.where(status: ['published', 'embargoed']).select(:id, :last_indexed).
         order(:id).limit(batch_count,offset).each { |item|
      map.add '/uc/item/' + item.id[/^qt(.*)$/, 1], :period => :monthly, :updated => item.last_indexed.to_s[/\d\d\d\d-\d\d-\d\d/]
    }
  }
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

# So instead, let's create the index manually.
get "/siteMapIndex.xml" do
  content_type :xml
  return %{<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd">
    #{%w{Static Campus Journal ORU Series MonographSeries Special}.map { |kind|
      "  <sitemap> <loc>https://escholarship.org/siteMap%s.xml</loc> </sitemap>" % kind
    }.join("\n")}
    #{(0..ITEM_BUCKETS-1).map { |pageNum|
      "  <sitemap> <loc>https://escholarship.org/siteMapItem-%02d.xml</loc> </sitemap>" % pageNum
    }.join("\n")}
</sitemapindex>
}
end

