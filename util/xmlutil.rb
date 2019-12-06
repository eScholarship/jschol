require 'date'
require 'nokogiri'
require_relative "./sanitize.rb"

###################################################################################################
# Monkey patches to make Nokogiri even more elegant
class Nokogiri::XML::Node

  ###################################################################################################
  # Utility method to return an element if it exists, create if not.
  #
  # If the 'before' option resolves as a relative path to an element of parent, the new element
  # will be inserted just before that.
  #
  def find!(elName, **opts)
    if not at(elName)
      if opts[:before] and at(opts[:before])
        child = at(opts[:before]).add_previous_sibling("<#{elName}/>")[0]
      else
        child = add_child("<#{elName}/>")[0]
      end
      child.namespace = nil   # prevent from inheriting parent's namespace
    end
    return at(elName)
  end

  ###################################################################################################
  # Utility method to make a Nokogiri::XML::Builder on an element
  def build()
    Nokogiri::XML::Builder.with(self) { |xml|
      yield(xml)
    }
  end

  ###################################################################################################
  # Just like build but clears all children first.
  def rebuild()
    xpath("*").remove
    Nokogiri::XML::Builder.with(self) { |xml|
      yield(xml)
    }
  end

  def text_at(xpath)
    el = at(xpath)
    el.nil? and return nil
    txt = el.text
    txt.nil? and return nil
    txt = txt.strip
    return txt.empty? ? nil : txt
  end

  def html_at(xpath)
    at(xpath) ? translateEntities(at(xpath).children.to_xml) : nil
  end

  def inner_xml=(str)
    self.children = Nokogiri::XML.fragment(str)
  end

end

###################################################################################################
def editXML(path)

  # Read in the existing XML data. Strip ignorable whitespace so we can properly indent later.
  doc = fileToXML(path)

  # Munge on it with the code block passed to this function
  yield doc.root

  # If not backed up recently, back up the file before replacing it.
  File.rename(path, "#{path}.old") if (Time.now - File.stat(path).mtime).to_i > 60

  # Write out modified data and replace the existing file.
  File.open("#{path}.tmp", 'w') { |io| doc.write_xml_to(io, indent:3) }
  File.rename("#{path}.tmp", path)
end

###################################################################################################
def fileToXML(path)
  Nokogiri::XML(File.open(path), &:noblanks)
end

###################################################################################################
def stringToXML(str)
  Nokogiri::XML(str, &:noblanks)
end

###################################################################################################
def stringFromXML(xml)
  return xml.to_xml(indent: 3)
end

###################################################################################################
# Make a hash representing the contents of an XML document or element. Does not retain all XML
# features, such as ordering of same-name elements, or intermixing text and elements.
def hashFromXML(el)

  # Let's start with namespaces
  attrs = {}
  if el.node_type == Nokogiri::XML::Node::ELEMENT_NODE
    el.namespace_definitions.each { |nsd|
      name = nsd.prefix ? "_xmlns:#{nsd.prefix}" : "_xmlns"
      attrs[name] = nsd.href
    }
  end

  # Then attributes
  el.keys.each { |name|
    attrs["_"+name] = el[name]
  }

  # Then the elements
  kids = Hash.new { |h,k| h[k] = [] }
  text = []
  el.children.each { |kid|
    if kid.node_type == Nokogiri::XML::Node::TEXT_NODE
      text << kid.text
    elsif kid.node_type == Nokogiri::XML::Node::ELEMENT_NODE
      kids[kid.name] << hashFromXML(kid)
    else
      raise("unsupported type in hashFromXML: #{kid.node_type.inspect}")
    end
  }

  # If there's only text, let's keep it simple
  if !text.empty?
    if attrs.empty? && kids.empty?
      return text.join("")
    end
    out[:_text] = text.join("")
  end

  out = attrs

  # Avoid arrays when we can
  kids.each { |name, vals|
    out[name] = vals.length == 1 ? vals[0] : vals
  }

  return out
end

###################################################################################################
def jsonFromXML(xml)
  return hashFromXML(xml).to_json
end
