require 'nokogiri'
require 'pathname'

###################################################################################################
def travAndFormat(data, out)
  if data.text?
    text = data.to_s
    return if text.nil?
    text = text.strip
    return if text.empty?
    if out[:attrs].empty?
      out[:chunks] << text
    else
      tmp = out[:attrs].clone
      tmp[:str] = text
      out[:chunks] << tmp
    end
  elsif data.element?
    prevAttrs = out[:attrs]
    out[:attrs] = out[:attrs].clone
    case data.name.downcase
      when "sup";         out[:attrs][:sup] = true
      when "sub";         out[:attrs][:sub] = true
      when "b", "strong"; out[:attrs][:bold] = true
      when "i", "em";     out[:attrs][:italic] = true
    end
    data.children.each { |sub|
      travAndFormat(sub, out)
    }
    out[:attrs] = prevAttrs
  else
    raise "Unknown type in trav: #{data.inspect}"
  end
end

###################################################################################################
def formatText(htmlStr)
  data = Nokogiri::HTML(sanitizeHTML(htmlStr)) do |config|
    config.noblanks.nodtdload
  end
  out = { size:0, attrs: {}, chunks:[] }
  travAndFormat(data.root, out)
  return out[:chunks]
end

###################################################################################################
def splashInstrucs(itemID)
  item = Item[itemID]
  instruc = []

  unitIDs = UnitItem.where(:item_id => itemID, :is_direct => true).order(:ordering_of_units).select_map(:unit_id)
  unit = unitIDs ? $unitsHash[unitIDs[0]] : nil
  campus = unit ? $unitsHash[getCampusId(unit)] : nil
  instruc << { h1: { text: campus ? campus.name : "eScholarship" } }
  if unit
    instruc << { h2: { text: unit.name } }
  end

  if item.title
    # TODO: Truncation
    # TODO: bold, italic, sub, sup
    instruc << { h3: { text: "Title:" } } <<
               { paragraph: { text: formatText(item.title) } }
  end

  permalink = "http://escholarship.org/uc/item/#{itemID.sub(/^qt/,'')}"
  instruc << { h3: { text: "Permalink:" } } <<
             { paragraph: { link: { url: permalink, text: permalink } } }

  return instruc
end

###################################################################################################
def getRealPath(path)
  Pathname.new(path).realpath.to_s
end

###################################################################################################
def sendSplash(itemID, request, mrtFile)
  # Figure out the hostname so we can properly address the splash page web service.
  request.url =~ %r{^https?://([^/:]+)(:\d+)?(.*)$} or fail
  host = $1

  # We'll need a temp file for the splash page and the combined file
  outFile = $fileCache.find("splash_#{itemID}.pdf")
  if !outFile
    splashTemp = Tempfile.new(["splash_", ".pdf"], TEMP_DIR)
    begin
      combinedTemp = Tempfile.new(["combined_", ".pdf"], TEMP_DIR)
      begin
        data = { pdfFile: getRealPath(mrtFile),
                 splashFile: getRealPath(splashTemp.path),
                 combinedFile: getRealPath(combinedTemp.path),
                 instrucs: splashInstrucs(itemID) }
        response = HTTParty.post("http://#{host}:8081/splash/splashGen", body: data.to_json.encode("UTF-8"))
        response.success? or puts("Error #{response.code} fetching splash page: #{response.message}")
        response.success? or halt(response.code, response.message)
        outFile = $fileCache.take("splash_#{itemID}.pdf", combinedTemp)
        return send_file outFile
      ensure
        combinedTemp.unlink
      end
    ensure
      splashTemp.unlink
    end
  end
  send_file outFile
end

