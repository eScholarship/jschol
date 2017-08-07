require 'sanitize'

###################################################################################################
# The first line of defense against unwanted or unsafe HTML is the WYSIWIG editor's built-in
# filtering. However, since this is an API we cannot rely on that. This is the second line of
# defense.
def sanitizeHTML(htmlFragment)
  out = Sanitize.fragment(htmlFragment,
    elements: %w{b em i strong u} +                             # all 'restricted' tags
              %w{a br li ol p small strike sub sup ul hr img},  # subset of ''basic' tags
    attributes: { "a" => ['href'], "img" => ['src', 'alt'] },
    protocols:  { "a" => {'href' => ['ftp', 'http', 'https', 'mailto', :relative]},
                  "img" => {'src' => ['http', 'https', :relative]} }
  )
  return out
end
