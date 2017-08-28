require 'htmlentities'
require 'sanitize'

$htmlCoder = nil

###################################################################################################
# Translate HTML entites, e.g. "&#x2019;" to curly quote, or "&eacute;" to an e with acute accent.
def translateEntities(htmlFragment)
  # Decode HTML entities
  $htmlCoder or $htmlCoder = HTMLEntities.new
  return $htmlCoder.decode(htmlFragment)
end

###################################################################################################
# The first line of defense against unwanted or unsafe HTML is the WYSIWIG editor's built-in
# filtering. However, since this is an API we cannot rely on that. This is the second line of
# defense.
def sanitizeHTML(htmlFragment)

  if htmlFragment =~ /&/
    # Translate all entities.
    htmlFragment = translateEntities(htmlFragment)
  end

  if htmlFragment =~ /</
    # Normalize tag names
    htmlFragment = htmlFragment.gsub("<super>", "<sup>").gsub("</super>", "</sup>").
                                gsub("<subscript>", "<sub>").gsub("</subscript>", "</sub>").
                                gsub("<italic>", "<i>").gsub("</italic>", "</i>").
                                gsub("<bold>", "<b>").gsub("</bold>", "</b>")
  end

  # Sanitize the result
  return Sanitize.fragment(htmlFragment,
    elements: %w{b em i strong u} +
              %w{a br li ol p blockquote h1 h2 h3 h4 small strike sub sup ul hr img},
    attributes: { "a" => ['href'], "img" => ['src', 'alt'] },
    protocols:  { "a" => {'href' => ['ftp', 'http', 'https', 'mailto', :relative]},
                  "img" => {'src' => ['http', 'https', :relative]} }
  ).strip
end
