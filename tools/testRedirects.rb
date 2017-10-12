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
  if result =~ %r{HTTP/1.1 (30[12]).*Location: ([^\n]+)}m
    got = $2.strip
    toURL == got or error("Incorrect redirect. #{fromURL} -> #{got} but expected #{toURL}")
  elsif result =~ %r{HTTP/1.1 (\d+)}
    code = $1.to_i
    if code == 200
      error "#{fromURL} got 200, should have redirected to #{toURL}"
    else
      error "error #{$1} from #{fromURL}"
    end
  else
    error "huh? #{fromURL} #{result}"
  end
end

# Redirect from supp file to item
testRedirect("http://escholarship.org/uc/item/3kq9770m/socr_pt4_20070806_v256_part_2.mpg",
             "http://escholarship.org/uc/item/3kq9770m")

# Strip query parameters from item URLs
testRedirect("http://escholarship.org/uc/item/0nm3g51w?foo=bar",
             "http://escholarship.org/uc/item/0nm3g51w")

# Specific item to item redirects
testRedirect("http://escholarship.org/uc/item/0fz9h5rt",
             "http://escholarship.org/uc/item/13x9v6ms")

# Redirect www.escholarship to escholarship
testRedirect("http://www.escholarship.org",
             "http://escholarship.org/")
testRedirect("http://www.escholarship.org/uc/uclta",
             "http://escholarship.org/uc/uclta")
testRedirect("http://www.escholarship.org/uc/uclta?foo=bar",
             "http://escholarship.org/uc/uclta?foo=bar")
