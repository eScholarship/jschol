require 'date'
require 'nokogiri'

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
    at(xpath) ? at(xpath).text : nil
  end

  # Translate entities, e.g. "&#x2019;" to curly quote
  def translateEntities(text)
    return text.gsub(/&#x([0-9a-fA-F]+);/) { [$1.hex].pack("U") }
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
