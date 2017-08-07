require 'sanitize'

###################################################################################################
# The first line of defense against unwanted or unsafe HTML is the WYSIWIG editor's built-in
# filtering. However, since this is an API we cannot rely on that. This is the second line of
# defense.
def sanitizeHTML(htmlFragment)
  return Sanitize.fragment(htmlFragment,
    elements: %w{b em i strong u} +
              %w{a br li ol p blockquote h1 h2 h3 h4 small strike sub sup ul hr img},
    attributes: { "a" => ['href'], "img" => ['src', 'alt'] },
    protocols:  { "a" => {'href' => ['ftp', 'http', 'https', 'mailto', :relative]},
                  "img" => {'src' => ['http', 'https', :relative]} }
  ).strip
end
