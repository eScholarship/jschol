
# This class generates a simpler breadcrumb for the browse and static pages. 
class Hierarchy_Manual

  def initialize(nameUrls)
    @nameUrls = nameUrls   # An array of name/url hashes ordered bottom up
  end

  # ---Public Method---
  # Generate breadcrumb object. Iterate through array of hashes containing name/url key-values 
  def generateCrumb
    nodes = []
    @nameUrls.each { |x|
      nodes.unshift(x)
    }
    nodes.unshift({"name" => "eScholarship", "url" => "/"})
    return nodes
  end

end

