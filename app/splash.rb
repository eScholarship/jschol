require 'nokogiri'
require 'pathname'

SPLASH_MAX_TEXT = 250
SPLASH_MAX_AUTHORS = 3

###################################################################################################
def travAndFormat(data, out)
  if data.text?
    text = data.to_s
    return if text.nil? || text.empty?  # but do not strip - space at beg or end can be significant
    if out[:textSize] + text.length > SPLASH_MAX_TEXT
      # Truncate long titles
      toAdd = SPLASH_MAX_TEXT - out[:textSize]
      return if toAdd == 0
      text = text[0, toAdd].strip
      out[:truncated] = true
    end
    out[:textSize] += text.length
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
  out = { textSize:0, trucated: false, attrs: {}, chunks:[] }
  travAndFormat(data.root, out)
  if out[:truncated]
    out[:chunks] << "..."
  end
  return out[:chunks]
end

###################################################################################################
def splashInstrucs(itemID)
  item = Item[itemID]
  attrs = JSON.parse(item[:attrs])
  instruc = []

  # Primary unit
  unitIDs = UnitItem.where(:item_id => itemID, :is_direct => true).order(:ordering_of_units).select_map(:unit_id)
  unit = unitIDs ? $unitsHash[unitIDs[0]] : nil
  campus = unit ? $unitsHash[getCampusId(unit)] : nil
  instruc << { h1: { text: campus ? campus.name : "eScholarship" } }
  unit and instruc << { h2: { text: unit.name } }

  # Title
  if item.title
    instruc << { h3: { text: "Title:" } } << { paragraph: { text: formatText(item.title) } }
  end

  # Permalink
  permalink = "http://escholarship.org/uc/item/#{itemID.sub(/^qt/,'')}"
  instruc << { h3: { text: "Permalink:" } } << { paragraph: { link: { url: permalink, text: permalink } } }

  # Journal info
  journalText = nil
  issn = nil
  if item.section
    # eSchol journals
    sect = Section[item.section]
    issue = Issue[sect.issue_id]
    journal = Unit[issue.unit_id]
    journalText = journal.name
    if issue.volume
      journalText << ", #{issue.volume}"
      issue.issue and journalText << "(#{issue.issue})"
    end
    issn = JSON.parse(unit.attrs)["issn"]
  elsif (ext = attrs["ext_journal"]) && ext["name"]
    # External journals
    journalText = ext["name"]
    if ext["volume"]
      journalText << ", #{ext["volume"]}"
      ext["issue"] and journalText << "(#{ext["issue"]})"
    end
    issn = ext["issn"]
  end
  if journalText
    instruc << { h3: { text: "Journal:" } } << { paragraph: { text: journalText } }
  end

  # Authors
  nAuthors = ItemAuthors.where(item_id: itemID).count
  if nAuthors > 0
    instruc << { h3: { text: "Author#{nAuthors > 1 ? 's' : ''}" } }
    ItemAuthors.where(item_id: itemID).limit(SPLASH_MAX_AUTHORS).each { |auth|
      authAttrs = JSON.parse(auth.attrs)
      authAttrs["name"] and instruc << { paragraph: { text: authAttrs["name"] } }
    }
    if nAuthors > SPLASH_MAX_AUTHORS
      instruc << { paragraph: { link: { url: "#{permalink}#author", text: "et al." } } }
    end
  end

  # Publication date
  instruc << { h3: { text: "Publication date:" } } << { paragraph: { text: item.pub_date } }

  # DOI
  attrs["doi"] and instruc << { h3: { text: "DOI:" } } << { paragraph: { text: attrs["doi"] } }

  # ISSN / ISBN
  issn and instruc << { h3: { text: "ISSN:" } } << { paragraph: { text: issn } }
  attrs["isbn"] and instruc << { h3: { text: "ISBN:" } } << { paragraph: { text: attrs["isbn"] } }

  # Flags
  flagText = ""
  attrs["is_peer_reviewed"] and flagText << "#{flagText.empty? ? '' : '|'}Peer reviewed"
  attrs["is_undergrad"] and flagText << "#{flagText.empty? ? '' : '|'}Undergraduate"
  attrs["is_undergrad"] and flagText << "#{flagText.empty? ? '' : '|'}Undergraduate"
  item.genre == "dissertation" and flagText << "#{flagText.empty? ? '' : '|'}Thesis/dissertation"
  flagText.empty? or instruc << { paragraph: { text: "\n#{flagText}" } }

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
  content_type "application/pdf"
  send_file outFile
end

