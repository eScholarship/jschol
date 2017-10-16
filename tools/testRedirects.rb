#!/usr/bin/env ruby

require 'uri'

def error(msg)
  puts "Error: #{msg}"
  exit 1
end

def testRedirect(fromURL, toURL)
  uri = URI.parse(fromURL)
  host = uri.host
  cmd = %{curl --silent --resolve #{host}:4001:127.0.0.1 -I "#{fromURL.sub(/:\/\/([^\/]+)/, '://\1:4001')}"}
  result = `#{cmd}`.encode!('UTF-8', 'UTF-8', :invalid => :replace)
  if result =~ %r{HTTP/1.1 (30[123]).*Location: ([^\n]+)}m
    got = $2.strip
    if toURL != got
      error("Incorrect redirect. #{fromURL.inspect} -> #{got.inspect} but expected #{toURL.inspect}")
    end
  elsif result =~ %r{HTTP/1.1 (\d+)}
    code = $1.to_i
    if code == 200
      return if toURL.nil?
      error "#{fromURL.inspect} got 200, should have redirected to #{toURL.inspect}"
    else
      error "error #{$1} from #{fromURL.inspect}"
    end
  else
    puts cmd
    error "huh? #{fromURL.inspect} #{result.inspect}"
  end
end

# Old HTML pages
testRedirect("http://escholarship.cdlib.org/about_news_pkp_partnership.html",
             "http://escholarship.org/")
testRedirect("http://escholarship.cdlib.org/rtennant/presentations/2004oregon/alice.htm",
             "http://escholarship.org/")

# Old CGIs
testRedirect("http://escholarship.cdlib.org/sunbbs.cgi?mode=form",
             "http://escholarship.org/")
testRedirect("http://escholarship.cdlib.org/cgi-bin/mail.ucpress",
             "http://escholarship.org/")

# Get rid of terminal slash
testRedirect("http://escholarship.org/uc/ucsc_games_cmps80k/item/55h19976/",
             "http://escholarship.org/uc/ucsc_games_cmps80k/item/55h19976")
testRedirect("http://escholarship.org/uc/doj/",
             "http://escholarship.org/uc/doj")

# Convenience
testRedirect("http://escholarship.org/uc/item/qt00f756qs",
             "http://escholarship.org/uc/item/00f756qs")

# DOJ redirects
testRedirect("http://dermatology.cdlib.org//143/index.html",
             "http://escholarship.org/uc/doj/14/3")
testRedirect("http://dermatology.cdlib.org//102/case_presentations/pseudomonas/2.jpg",
             "http://escholarship.org/uc/item/6fz6c3r8")
testRedirect("http://dermatology.cdlib.org//search?uri=1&go=1&entity=doj&keyword=Search%20journal...&q=1&scope=../../../../../../../../../../../../../../../../etc/passwd",
             "http://escholarship.org/uc/doj")

# Bepress redirects
testRedirect("http://escholarship.org/uc/temporary?bpid=2251892",
             "http://escholarship.org/uc/item/00f756qs")
testRedirect("http://repositories.cdlib.org/uctc",
             "http://escholarship.org/uc/uctc")
testRedirect("http://repositories.cdlib.org/its/tsc",
             "http://escholarship.org/uc/its_tsc")
testRedirect("http://repositories.cdlib.org/acgcc/jtas/vol1/iss1/art8",
             "http://escholarship.org/uc/item/4035s7ss")
testRedirect("http://repositories.cdlib.org//acgcc/jtas/emoryelliott.html",
             "http://escholarship.org/uc/acgcc_jtas")
testRedirect("http://repositories.cdlib.org/cgi/viewcontent.cgi?article=1006&context=its/tsc",
             "http://escholarship.org/uc/item/0201j0v2")
testRedirect("http://repositories.cdlib.org/context/tc/article/1194/type/pdf/viewcontent",
             "http://escholarship.org/uc/item/8hk6960q")
testRedirect("http://repositories.cdlib.org//cgi/viewcontent.cgi?context=its/tsc&amp;article=1045",
             "http://escholarship.org/uc/item/1h52s226")

# Programmed unit redirects from unitRedirect.xsl
testRedirect("http://escholarship.org/uc/ioe",
             "http://escholarship.org/uc/ioes")

# Unit to landing page
testRedirect("http://escholarship.org/uc/search?entity=uciem_westjem",
             "http://escholarship.org/uc/uciem_westjem")

# Don't redirect unit subpages
testRedirect("http://escholarship.org/uc/doj/contactus", nil)

# Journal issue
testRedirect("http://escholarship.org/uc/search?entity=uciem_westjem;volume=18;issue=6.1",
             "http://escholarship.org/uc/uciem_westjem/18/6.1")

# Keyword search
testRedirect("http://escholarship.org/uc/search?keyword=japan",
             "http://escholarship.org/search?q=japan")

# Redirect eScholarship Editions
testRedirect("http://escholarship.org/editions/view?docId=ft6d5nb46p&chunk.id=nsd0e372&toc.id=endnotes&toc.depth=1&brand=ucpress&anchor.id=d0e436",
             "https://publishing.cdlib.org/ucpressebooks/view?docId=ft6d5nb46p&chunk.id=nsd0e372&toc.id=endnotes&toc.depth=1&brand=ucpress&anchor.id=d0e436")

# Redirect garbled or old searches
testRedirect("http://escholarship.org/uc/item/3nm3m1rv?query=%E5%98%97%E9%BA%A5&hitNum=1&scroll=yes",
             "http://escholarship.org/uc/item/3nm3m1rv")

# Redirect pvw item to main item
testRedirect("http://pvw.escholarship.org/uc/item/5j20j32b",
             "http://escholarship.org/uc/item/5j20j32b")

# Redirect eprints to eschol
testRedirect("http://eprints.cdlib.org/uc/item/8gj3x1dc",
             "http://escholarship.org/uc/item/8gj3x1dc")

# Redirect eschol.cdlib
testRedirect("http://escholarship.cdlib.org/uc/item/9ws876kn.pdf",
             "https://cloudfront.escholarship.org/dist/prd/content/qt9ws876kn/qt9ws876kn.pdf")

# Redirect old PDF links
testRedirect("http://escholarship.org/uc/item/4590m805.pdf",
             "https://cloudfront.escholarship.org/dist/prd/content/qt4590m805/qt4590m805.pdf")

# No longer redirecting PDF links
testRedirect("http://escholarship.org/content/qt4590m805/qt4590m805.pdf", nil)

# Redirect from supp file to item
testRedirect("http://escholarship.org/uc/item/3kq9770m/socr_pt4_20070806_v256_part_2.mpg",
             "http://escholarship.org/uc/item/3kq9770m")
# but not new-style sub files
testRedirect("http://escholarship.org/content/qt0zw0j0hz/inner/1.jpg", nil)

# Strip query parameters from item URLs
testRedirect("http://escholarship.org/uc/item/0nm3g51w?foo=bar",
             "http://escholarship.org/uc/item/0nm3g51w")

# Specific item to item redirects
testRedirect("http://escholarship.org/uc/item/0fz9h5rt",
             "http://escholarship.org/uc/item/13x9v6ms")

# Redirect www.escholarship to escholarship
testRedirect("http://www.escholarship.org",
             "http://escholarship.org/")
testRedirect("http://www.escholarship.org/",
             "http://escholarship.org/")
testRedirect("http://www.escholarship.org/uc/uclta",
             "http://escholarship.org/uc/uclta")
testRedirect("http://www.escholarship.org/uc/uclta?foo=bar",
             "http://escholarship.org/uc/uclta?foo=bar")

# Things that should not redirect
testRedirect("http://escholarship.org/uc/ucbclassics", nil)
testRedirect("http://escholarship.org/bower_components/babel-polyfill/browser-polyfill.js", nil)
testRedirect("http://escholarship.org/uc/item/8304n08d", nil)
