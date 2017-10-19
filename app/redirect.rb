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
    elsif $staticRedirects[uri.path]
      uri.path = $staticRedirects[uri.path]
      uri.query = nil
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
    elsif ["www.escholarship.org", "pvw.escholarship.org", "eprints.cdlib.org", "escholarship.cdlib.org"].include?(uri.host)
      uri.host = "escholarship.org"
    elsif uri.path =~ %r{^/uc/item/(\w+)(.*)}
      uri = handleItemRedirect(uri, $1, $2)
    elsif uri.path =~ %r{^/uc/search}
      # not working yet:
      #&& !(uri.query =~ %r{smode=(pmid|PR|postprintReport|repec|bpList|eeList|etdLinks|getDescrip|getAbstract|getFiles)})
      uri = handleSearchRedirect(uri)
    elsif uri.path =~ %r{^/uc/temporary}
      uri = handleBpTempRedirect(uri)
    elsif uri.path =~ %r{^/uc/([^/]+)(.*)}
      uri = handleUnitRedirect(uri, $1, $2)
    elsif uri.host == "repositories.cdlib.org"
      uri = handleBepressRedirect(uri)
    elsif uri.host =~ /dermatology(-s10)?.cdlib.org/
      uri = handleDojRedirect(uri)
    elsif uri.path =~ /(\.html?$)|(\.cgi)|(cgi-bin)/   # old HTML and CGI pages
      uri.path = "/"
      uri.query = nil
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
    return uri, 301
  end
end

###################################################################################################
def handleItemRedirect(uri, itemID, remainder)
  uri.query = nil  # we don't support any queries params on new items
  if itemID =~ /^qt(\w{8})/
    uri.path = "/uc/item/#{$1}#{remainder}"
  elsif !(itemID =~ /^\w{8}$/)
    return nil  # not found
  elsif (redir = Redirect.where(kind: "item", from_path: "/uc/item/#{itemID}").first)
    uri.path = "#{redir.to_path}#{remainder}"
  elsif remainder =~ %r{^/.*}
    uri.path = "/uc/item/#{itemID}"
  elsif remainder =~ %r{^\.pdf}
    if $cloudFrontConfig
      uri = URI.parse("#{$cloudFrontConfig['public-url']}/content/qt#{itemID}/qt#{itemID}.pdf")
    else
      uri.path = "/content/qt#{itemID}/qt#{itemID}.pdf"
    end
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
  elsif uri.query =~ %r{keyword=([^;]+)}
    kwd = $1
    uri.path = "/search"
    uri.query = "q=#{kwd}"
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
    uri.path = "#{redir.to_path}#{remainder}"
  end
  return uri
end
