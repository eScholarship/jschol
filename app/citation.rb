####################################################
# Methods for building citation object. Used by citeproc.js
# https://github.com/citation-style-language/schema/blob/master/csl-data.json

def getDateString(d)
  return d.strftime('%Y-%-m-%-d')
end

def getAuthors(a)
  if !a
    return nil
  else
    a_mapped = []
    # ToDo: map middle name when it's present: {fname"+"middle" => "given"}
    #       and handle for when it's not
    mappings = {"name" => "literal", "lname" => "family", "fname" => "given"} 
    a.each do |x|
      a_mapped << x.map {|k, v| [mappings[k]||k, v]}.to_h
    end 
  end
  return a_mapped
end

def getCitation(shortArk, authors, attrs)
  id = "qt"+shortArk
  item = Item[id]

  c = {
    :id => id,
    # ToDo: Put item genre here, and might also need to combine with unit type (i.e. article-journal)
    :type => "article",
    :title => item.title,
    :URL => "http://" + request.host + "/item/" + shortArk,
    :issued => {"raw": [getDateString(item.pub_date)]}
  }
  if attrs['publisher']
    c[:publisher] = attrs['publisher']
  end
  # c[:DOI] = ""
  # c[:ISSN] = ""
  a = getAuthors(authors)
  a ?  c[:author] = a : c[:author] = nil
  return c
end
