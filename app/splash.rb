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
# Parses and formats data availability statement. Returns [text, (link)]
def getDataAvail(itemAttrs)
  ds = itemAttrs["data_avail_stmnt"] or return nil
  case ds["type"]
    when "publicRepo"
      return "The data associated with this publication are available at: ", ds["url"]
    when "publicRepoLater"
      return "Associated data will be made available after this publication is published."
    when "suppFiles"
      return "The data associated with this publication are in the supplemental files."
    when "withinManuscript"
      return "The data associated with this publication are within the manuscript."
    when "onRequest"
      return "The data associated with this publication are available upon request."
    when "thirdParty"
      return "The data associated with this publication are managed by: #{ds["contact"]}"
    when "notAvail"
      return "The data associated with this publication are not available for this reason: #{ds["reason"]}"
    else
      raise "Unknown data_avail_stmnt type #{ds["type"].inspect}"
  end
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
    instruc << { h3: { text: "Title" } } << { paragraph: { text: formatText(item.title) } }
  end

  # Permalink
  request.url =~ %r{^(https?://[^/:]+(:\d+)?)(.*)$} or fail
  urlStart = $1
  permalink = "#{urlStart}/uc/item/#{itemID.sub(/^qt/,'')}"
  instruc << { h3: { text: "Permalink" } } << { paragraph: { link: { url: permalink, text: permalink } } }

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
    instruc << { h3: { text: "Journal" } } << { paragraph: { text: journalText } }
  end

  # ISSN / ISBN
  issn and instruc << { h3: { text: "ISSN" } } << { paragraph: { text: issn } }
  attrs["isbn"] and instruc << { h3: { text: "ISBN" } } << { paragraph: { text: attrs["isbn"] } }

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
  instruc << { h3: { text: "Publication Date" } } << { paragraph: { text: item.pub_date } }

  # DOI
  attrs["doi"] and instruc << { h3: { text: "DOI" } } << { paragraph: { text: attrs["doi"] } }

  # Supplemental material
  if attrs["supp_files"]
    link = "#{permalink}#supplemental"
    instruc << { h3: { text: "Supplemental Material" } } <<
               { paragraph: { link: { url: link, text: link } } }
  end

  # Data availability statement
  dsText, dsLink = getDataAvail(attrs)
  if dsText
    instruc << { h3: { text: "Data Availability" } }
    if dsLink
      instruc << { paragraph: [ { text: dsText }, { link: { url: dsLink, text: dsLink } } ] }
    else
      instruc << { paragraph: { text: dsText } }
    end
  end

  # License
  if item.rights
    licenseVer = "4.0"
    ccLink = "https://creativecommons.org/licenses/#{item.rights.sub('CC ', '').downcase}/#{licenseVer}"
    instruc << { h3: { text: "License" } } <<
               { paragraph: { link: { url: ccLink, text: "#{item.rights} #{licenseVer}" } } }
  end

  # Flags
  flagText = ""
  attrs["is_peer_reviewed"] and flagText << "#{flagText.empty? ? '' : '|'}Peer reviewed"
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
        puts "Sending splash data: #{data.to_json.encode("UTF-8")}"
        response = HTTParty.post("http://#{ENV['HOST']}:8081/splash/splashGen", body: data.to_json.encode("UTF-8"))
        if !response.success?
          puts("Warning: Got code #{response.code} fetching splash page: #{response.message}")
          return send_file mrtFile
        end
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

