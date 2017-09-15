require 'nokogiri'

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

  return instruc.to_json.gsub("|", "") + "|"
end
