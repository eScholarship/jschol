#!/usr/bin/env ruby

require 'uri'

$hostname = `/bin/hostname`.strip
$hostIP = $hostname =~ /^pub-jschol/ ? `/bin/hostname --ip-address`.strip : "127.0.0.1"
$mainPort = ENV['PUMA_PORT'] or raise("missing env PUMA_PORT")

$cfPrefix = ENV['CLOUDFRONT_PUBLIC_URL'] || "http://escholarship.org"

def error(msg)
  puts "Error: #{msg}"
  exit 1
end

def testRedirect(fromURL, toURL)
  uri = URI.parse(fromURL)
  host = uri.host
  cmd = %{curl --silent --resolve #{host}:#{$mainPort}:#{$hostIP} -I "#{fromURL.sub(/:\/\/([^\/]+)/, '://\1:'+$mainPort.to_s)}"}
  result = `#{cmd}`.encode!('UTF-8', 'UTF-8', :invalid => :replace)
  if result =~ %r{HTTP/1.1 (30[123]).*Location: ([^\n]+)}m
    got = $2.strip
    if (toURL.nil? && fromURL.sub(/^http/,'https') != got) ||
       (!toURL.nil? && toURL.sub(/^https/,'http') != got.sub(/^https/,'http'))
      error("Incorrect redirect. #{fromURL.inspect} -> #{got.inspect} but expected #{toURL.inspect}")
    else
      print "."
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

# Redirect old CloudFront URLs
testRedirect("http://cloudfront.escholarship.org/dist/wJD5zTgC2vrImRR/dist/prd/content/qt2dz7t8r8/qt2dz7t8r8.pdf?t=p0khvh",
             "http://escholarship.org/content/qt2dz7t8r8/qt2dz7t8r8.pdf?t=p0khvh")
testRedirect("http://cloudfront.escholarship.org/dist/prd/content/qt5563x8nf/qt5563x8nf.pdf?t=mpqhzr&v=lg",
             "http://escholarship.org/content/qt5563x8nf/qt5563x8nf.pdf?t=mpqhzr&v=lg")

# Redirect alias of old load balancer
testRedirect("http://pub-jschol-prd.escholarship.org/ucoapolicies", "http://escholarship.org/ucoapolicies")

# Redirect escholarship.ucop.edu to eschol
testRedirect("http://escholarship.ucop.edu/uc/ucpress", "http://escholarship.org/uc/ucpress")

# OA policy images
testRedirect("http://escholarship.org/oa_harvester/ucsc/ucsc_email_header.png",
             "http://escholarship.org/images/oa_harvester/ucsc/ucsc_email_header.png")

# Browse URLs
testRedirect("http://escholarship.org//uc/search?smode=browse;browse-department=ucla/",
             "http://escholarship.org/ucla/units")
testRedirect("http://escholarship.org//uc/search?smode=browse;browse-department=yes",
             "http://escholarship.org/campuses")
testRedirect("http://escholarship.org//uc/search?smode=browse;browse-journal=aa",
             "http://escholarship.org/journals")
testRedirect("http://escholarship.org//uc/search?smode=browse;browse-journal=yes",
             "http://escholarship.org/journals")
testRedirect("http://escholarship.org/uc/search?smode=browse;browse-creator=oo",
             "http://escholarship.org/campuses")

# Old stats reports
testRedirect("http://escholarship.org/uc/stats/author/edu/ucsd/lrichmond/richmond_lawana_nicole.html",
             "https://help.escholarship.org/support/solutions/articles/9000131087")

# Crazy item URL from google
testRedirect("http://escholarship.org/uc/item/49n325b7%253Fimage.view%253DgenerateImage%253BimgWidth%253D600%253BpageNum%253D1",
             "http://escholarship.org/uc/item/49n325b7")
testRedirect("http://escholarship.org/uc/item/49n325b7?image.view=generateImage;imgWidth=600;pageNum=1",
             "http://escholarship.org/uc/item/49n325b7")

# Journal/unit page
testRedirect("http://escholarship.org/uc/search?entity=uciem_westjem;view=journal_policies",
             "http://escholarship.org/uc/uciem_westjem/journal_policies")

# Things that should not redirect
testRedirect("http://escholarship.org/repec/", nil)
testRedirect("http://escholarship.org/repec/cdlseri.rdf", nil)
testRedirect("http://escholarship.org/uc/search?smode=pmid;pubType=journal;relation-exclude=springer;subSet=0", nil)
testRedirect("http://escholarship.org/uc/ucbclassics", nil)
testRedirect("http://escholarship.org/node_modules/flickity/dist/flickity.min.css", nil)
testRedirect("http://escholarship.org/uc/item/8304n08d", nil)
testRedirect("http://escholarship.org/search/?q=china", nil)
testRedirect("http://escholarship.org/api/pageData/search?q=china&searchType=eScholarship&searchUnitType=departments", nil)

# Old HTML pages
#testRedirect("http://escholarship.cdlib.org/about_news_pkp_partnership.html",
#             "http://escholarship.org/")
#testRedirect("http://escholarship.cdlib.org/rtennant/presentations/2004oregon/alice.htm",
#             "http://escholarship.org/")

# Old CGIs
testRedirect("http://escholarship.cdlib.org/sunbbs.cgi?mode=form",
             "http://escholarship.org/")
testRedirect("http://escholarship.cdlib.org/cgi-bin/mail.ucpress",
             "http://escholarship.org/")

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
testRedirect("http://dermatology.cdlib.org/robots.txt", "https://escholarship.org/uc/doj")
testRedirect("http://dermatology.cdlib.org", "https://escholarship.org/uc/doj")
testRedirect("http://dermatology.cdlib.org/images/logo_eschol-mobile.svg", "https://escholarship.org/uc/doj")
testRedirect("http://dermatology-s10.cdlib.org/", "https://escholarship.org/uc/doj")
testRedirect("http://dermatology-s10.cdlib.org/145/nyu/cases/112106_3a.jpg", "https://escholarship.org/uc/item/90z93266")


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
             "#{$cfPrefix}/content/qt9ws876kn/qt9ws876kn.pdf")
testRedirect("http://www.escholarship.cdlib.org/uc/item/9ws876kn.pdf",
             "#{$cfPrefix}/content/qt9ws876kn/qt9ws876kn.pdf")
testRedirect("http://escholarship-s10.cdlib.org/uc/item/9ws876kn.pdf",
             "#{$cfPrefix}/content/qt9ws876kn/qt9ws876kn.pdf")
testRedirect("http://www.escholarship-s8.cdlib.org/uc/item/9ws876kn.pdf",
             "#{$cfPrefix}/content/qt9ws876kn/qt9ws876kn.pdf")

# Redirect old PDF links
testRedirect("http://escholarship.org/uc/item/4590m805.pdf",
             "#{$cfPrefix}/content/qt4590m805/qt4590m805.pdf")

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

puts "\nDone."
