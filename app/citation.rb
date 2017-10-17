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

def getCitation(unit, shortArk, authors, attrs)
  id = "qt"+shortArk
  item = Item[id]

  unit_attrs = unit ? JSON.parse(unit[:attrs]) : nil
  c = {
    :id => id,
    # ToDo: Put item genre here, and might also need to combine with unit type (i.e. article-journal)
    :type => item.genre,
    :title => item.title,
    :URL => "http://" + request.host + "/uc/item/" + shortArk,
    :issued => {"raw": [getDateString(item.pub_date)]}
  }
  if attrs['publisher']
    c[:publisher] = attrs['publisher']
  end
  c[:doi] = attrs['doi']
  c[:issn] = unit_attrs ? unit_attrs['issn'] : nil
  a = getAuthors(authors)
  a ?  c[:author] = a : c[:author] = nil
  return c
end
