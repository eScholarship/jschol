# Support for redirecting all old URLs to new

$machine = `/bin/hostname`.strip

###################################################################################################
def checkRedirect(origURI)
  uri = origURI.clone
  tried = Set.new
  while uri
    fromURI = uri.clone
    tried << uri
    if uri.path.include?(".php")  # We have no PHP on our site. These are almost always attacks anyhow
      uri = nil
    elsif uri.path =~ %r{^//+(.*)}  # normalize multiple initial slashes
      uri.path = "/#{$1}"
    elsif uri.host == "eschol.org"
      uri = handleShortenerRedirect(uri)
    elsif $staticRedirects[uri.path]
      if $staticRedirects[uri.path] =~ /^http/
        uri = URI.parse($staticRedirects[uri.path])
      else
        uri.path = $staticRedirects[uri.path].sub(%r{/+$}, '')  # doesn't accept trailing slashes
        uri.query = nil
      end
    #NO: It is not safe to get rid of these, e.g. http://escholarship.org/search?q=china
    #elsif uri.path =~ %r{^(.+)/+$}  # get rid of terminal slash(es) on all except root page
    #  uri.path = $1
    elsif uri.path =~ %r{^/editions/(.*)}
      remainder = $1
      uri.scheme = "https"
      uri.host = "publishing.cdlib.org"
      uri.port = nil
      uri.path = "/ucpressebooks/#{remainder}"
      return uri, 301
    # On production only, redirect http to https
    #elsif uri.scheme != "https" && $machine =~ /^pub-jschol-prd-2[ac]$/
    #  uri.scheme = "https"
    #  uri.port = nil
    elsif ["www.escholarship.org", "pvw.escholarship.org",
           "eprints.cdlib.org",
           "escholarship.cdlib.org", "www.escholarship.cdlib.org",
           "escholarship-s10.cdlib.org", "www.escholarship-s8.cdlib.org",
           "escholarship.ucop.edu", "cloudfront.escholarship.org",
           "pub-jschol-prd.escholarship.org"
          ].include?(uri.host)
      uri.host = "escholarship.org"
    elsif uri.path =~ %r{^/uc/oai/?(.*)}
      uri.path = "/oai#{$1}"
      break
    elsif uri.path =~ %r{^/uc/item/(\w+)(.*)}
      uri = handleItemRedirect(uri, $1, $2)
    elsif uri.path =~ %r{^/(dist/\w+/)?dist/prd/(.*)}
      uri.path = "/#{$2}"  # old CloudFront URLs
    elsif uri.path =~ %r{^/uc/search} &&
          !(uri.query =~ %r{smode=(pmid|PR|postprintReport|repec|bpList|eeList|etdLinks)\b})
      uri = handleSearchRedirect(uri)
    elsif uri.path =~ %r{^/uc/temporary}
      uri = handleBpTempRedirect(uri)
    elsif uri.path =~ %r{^/uc/stats/}
      uri = URI.parse("https://help.escholarship.org/support/solutions/articles/9000131087")
      break
    elsif uri.path =~ %r{^/uc/([^/]+)(.*)}
      uri = handleUnitRedirect(uri, $1, $2)
    elsif uri.host == "repositories.cdlib.org"
      uri = handleBepressRedirect(uri)
    elsif uri.host =~ /dermatology(-s10)?.cdlib.org/
      uri = handleDojRedirect(uri)
    elsif uri.path =~ %r{^/oa_harvester/}
      uri.path = "/images#{uri.path}"
      break
    elsif uri.path =~ /(\.html?$)|(\.cgi)|(cgi-bin)/ && !(uri.path =~ %r{/(inner|supp)/})  # old HTML and CGI pages
      fpath = "./app/#{sanitizeFilePath(uri.path).sub(%r{^/+}, '')}"
      if !File.exist?(fpath) # allow overlaid HTML files at the root, e.g. for Google site verification
        uri.path = "/"
        uri.query = nil
      end
    end
    break if uri == fromURI
    tried.include?(uri) and raise("URI redirect loop detected involving #{uri.to_s}")
  end

  if uri == origURI
    return nil, nil
  elsif uri.nil?
    return nil, 404
  else
    if uri.port == 4001 && uri.host != "localhost"
      uri.port = nil  # if redirecting, clear localhost port
    end
    # If already redirecting, might as well go all the way to https
    if uri.scheme != "https" && uri.host == "escholarship.org"
      uri.scheme = "https"
      uri.port = nil
    end
    #puts "Final redirect: #{origURI} -> #{uri}"
    return uri, 301
  end
end

###################################################################################################
def handleShortenerRedirect(uri)
  uri.host = "escholarship.org"
  if uri.path =~ %r{^/(\d\w\w\d\w\d\w\w)$} && Item["qt#{$1}"]
    uri.path = "/uc/item/#{$1}"
  elsif uri.path =~ %r{^/(\w.*)$} && Unit[$1]
    uri.path = "/uc/#{$1}"
  elsif uri.path == "/"
    uri.scheme = "https"
    uri.port = nil
    uri.host = "help.escholarship.org"
    uri.path = "/support/solutions/articles/9000177383"
  else
    uri.path = "/notfound"
  end
  return uri
end

###################################################################################################
def handleItemRedirect(uri, itemID, remainder)
  if uri.query && !(uri.query =~ /^((access|preview_key)=\w+&?)*$/)
    uri.query = nil  # we don't support any query params on new items except access and preview_key
  end
  if itemID =~ /^qt(\w{8})/
    uri.path = "/uc/item/#{$1}#{remainder}"
  elsif !(itemID =~ /^\w{8}$/)
    return nil  # not found
  elsif (redir = Redirect.where(kind: "item", from_path: "/uc/item/#{itemID}").first)
    uri.path = "#{redir.to_path}#{remainder}"
  elsif remainder =~ %r{^\.pdf}
    uri.path = "/content/qt#{itemID}/qt#{itemID}.pdf"
  elsif !remainder.empty?
    uri.path = "/uc/item/#{itemID}"
  end
  return uri
end

###################################################################################################
def handleSearchRedirect(uri)
  if uri.query =~ %r{entity=([\w_]+)$}
    unit = $1
    uri.path = "/uc/#{unit}"
    uri.query = nil
  elsif uri.query =~ %r{entity=([\w_]+);volume=([^;]+);issue=([^;]+)$}
    unit, vol, iss = $1, $2, $3
    uri.path = "/uc/#{unit}/#{vol}/#{iss}"
    uri.query = nil
  elsif uri.query =~ %r{entity=([\w_]+);view=([^;]+)$}
    unit, page = $1, $2
    uri.path = "/uc/#{unit}/#{page}"
    uri.query = nil
  elsif uri.query =~ %r{keyword=([^;]+)}
    kwd = $1
    uri.path = "/search"
    uri.query = "q=#{kwd}"
  elsif uri.query =~ %r{smode=browse}
    if uri.query =~ %r{browse-journal=}
      uri.path = "/journals"
    elsif uri.query =~ %r{browse-department=([\w_]+)}
      campus = $1
      uri.path = $unitsHash[campus] && $unitsHash[campus].type == "campus" ? "/#{campus}/units" : "/campuses"
    else
      uri.path = "/campuses"
    end
    uri.query = nil
  else
    return nil
  end
  return uri
end

###################################################################################################
def handleBepressRedirect(uri)
  # Clean up the path a bit, then add the query
  path = (uri.path.sub(%{^//},'/').sub(%r{/+$},'')) + (uri.query ? "?#{uri.query}" : "")
  path.sub! '&amp;', '&'

  # Don't use old hostname anymore, and strip off any query
  uri.host = "escholarship.org"
  uri.query = nil

  # Ordering sometimes nonstandard
  path.sub! %r{^/cgi/viewcontent.cgi\?article=([^&]+)&context=(.*)}, '/cgi/viewcontent.cgi?context=\2&article=\1'
  path.sub! %r{^/context/(.*)/article/(.*)/type/pdf/viewcontent}, '/cgi/viewcontent.cgi?context=\1&article=\2'

  # Remove more and more of the path, looking for an article or ORU match
  while path.length > 1
    if (redir = Redirect.where(kind: "bepress", from_path: path).first)
      uri.path = redir.to_path
      return uri
    end
    path =~ %r{/[^/]+$} or raise("failure parsing bp redirect path for #{uri.inspect}")  # prevent infinite loop
    path.sub!(%r{/[^/]+$},'')
  end

  # Fallback - see if there's any context that would lead to a unit
  if uri.query =~ %r{context[=/]([^/&]=)}
    unit = $1
    uri.path = "/uc/#{unit}"
    return uri
  end

  # Ultimate fallback - the eschol home page
  uri.path = "/"
  return uri
end

###################################################################################################
def handleBpTempRedirect(uri)
  if uri.query =~ /^bpid=(\d+)$/
    bpid = $1
    if (item = Item.where(Sequel.lit("attrs->\"$.bepress_id\" = \"#{bpid}\"")).first)
      uri.path = "/uc/item/#{item.id.sub(/^qt/,'')}"
      uri.query = nil
      return uri
    end
  end
  return nil # not found
end

###################################################################################################
def handleDojRedirect(uri)
  uri.host = "escholarship.org"
  uri.query = nil
  path = uri.path
  variations = [path,
                "#{path}/index.html",
                "#{path}/index.htm",
                path.sub(%r{/[^/]+$}, "/_catch_all"),
                path.sub(%r{/[^/]+/[^/]+$}, "/_catch_all"),
                path.sub(%r{/[^/]+/[^/]+/[^/]+$}, "/_catch_all")]
  variations.each { |var|
    if (redir = Redirect.where(kind: "doj", from_path: var).first)
      uri.path = redir.to_path
      return uri
    end
  }

  # Ultimate fallback to DOJ landing page
  uri.path = "/uc/doj"
  return uri
end


###################################################################################################
def handleUnitRedirect(uri, unit, remainder)
  if (redir = Redirect.where(kind: "unit", from_path: "/uc/#{unit}").first)
    uri.path = "#{redir.to_path.sub(/\?.*/, '')}#{remainder}"
    uri.query = redir.to_path.include?("?") ? redir.to_path.sub(/.*\?/, '') : nil
  elsif uri.query =~ /rmode=rss/ || remainder =~ %r{/rss}
    uri.path = "/rss/unit/#{unit}"
    uri.query = nil
  end
  return uri
end
