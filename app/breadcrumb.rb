
class BreadcrumbGenerator

  def initialize(thisPageName, type)
    @thisPageName = thisPageName
    @type = type
    @unitID = (type == "unit") ? thisPageName : getItemsUnit(thisPageName) 
  end

  # Returns an array containing topmost item under root ID and name, or empty array if root
  def getCampusInfo
    unitID = @unitID
    if unitID == 'root' 
      return [] 
    else
      until isCampus?(unitID) 
        unitID = UnitHier.filter(:unit_id => unitID, :is_direct => true).order(:ordering).map(:ancestor_unit)[0]
      end        
    end
    unit = Unit[unitID]
    return [unitID, unit.name]
  end

  # 1) Generate an array of nodes containing name/url pairs
  # If it's unit level, find parent using unit_hier table, otherwise,
  # for item level page look for the parent unit using the unit_item table
  # 2) Feed nodes into breadcrumb class
  def generateCrumb
    nodes = []

    if @type == "item"
      # ToDo: Journal/Non-journal displays differently
      nodes << ["Volume/Issue placeholder"]
    end

    unitID = @unitID

    until unitID == "root"
      unit = Unit[unitID]
      nodes << [unit.name, unitID != @thisPageName? "/unit/#{unitID}" : nil]
      # ToDo: Handle mutiple campuses
      unitID = UnitHier.filter(:unit_id => unitID, :is_direct => true).order(:ordering).map(:ancestor_unit)[0]
    end
    nodes << ["eScholarship"]

    breadcrumbs = Breadcrumbs.new
    nodes.reverse_each {|n| breadcrumbs.add n[0], n[1]}
    breadcrumbs.render(format: "Inline")
  end

  def getItemsUnit(pageName)
    itemID = 'qt' + pageName
    unitID = UnitItem.filter(:item_id => itemID, :is_direct => true).order(:ordering_of_units).map(:unit_id)[0]
    if !unitID
      raise "No Unit for this item " + itemID
    else 
      return unitID
    end
  end

  # Is this topmost item under root?  Technically can be campus OR oru (i.e. 'lbnl')
  def isCampus?(unitID)
    parents = UnitHier.filter(:unit_id => unitID, :is_direct => true).map { |hier| hier.ancestor_unit }
    r = parents ? parents[0] == 'root' : false
    return r
  end

  private :getItemsUnit, :isCampus?

end

###################################################################################################
# Breadcrumbs functionality courtesy https://github.com/fnando/breadcrumbs
#
# Implement the Render:Base class differently to generate a different navigation style. Currently 'Inline'

class Breadcrumbs
  attr_accessor :items

  def initialize
    self.items = []
  end

  # Add a new breadcrumbs.
  #
  #   breadcrumbs.add 'Home'
  #   breadcrumbs.add 'Home', '/'
  #   breadcrumbs.add 'Home', '/', class: 'home'
  #
  def add(text, url = nil, options = {})
    # options = {i18n: true}.merge(options)
    # text = translate(text) if options.delete(:i18n)
    items << [text.to_s, url, options]
  end

  alias :<< :add

  def render(options = {})
    klass = Render.const_get(options[:format].to_s)
    html = klass.new(self, options).render
    html.respond_to?(:html_safe) ? html.html_safe : html
  end


  module Render
    class Base
      attr_accessor :breadcrumbs
      attr_accessor :default_options

      def initialize(breadcrumbs, default_options = {})
        @breadcrumbs = breadcrumbs
        @default_options = default_options
      end

      # Build a HTML tag.
      #
      #   tag(:p, "Hello!")
      #   tag(:p, "Hello!", class: "hello")
      #   tag(:p, class: "phrase") { "Hello" }
      #
      def tag(name, *args, &block)
        options = args.pop if args.last.kind_of?(Hash)
        options ||= {}

        content = args.first
        content = self.instance_eval(&block) if block_given?

        attrs = " " + options.collect {|n, v| %[%s="%s"] % [n, v] }.join(" ") unless options.empty?

        %[<#{name}#{attrs}>#{content}</#{name}>]
      end

      protected
      def wrap_item(url, text, options)
        if url
          tag(:a, text, options.merge(:href => url))
        else
          tag(:span, text, options)
        end
      end
    end

    class Inline < Base
      def render
        options = {
          class: "breadcrumbs",
          separator: "&#187;"
        }.merge(default_options)

        html = []
        items = breadcrumbs.items
        size = items.size

        items.each_with_index do |item, i|
          html << render_item(item, i, size)
        end

        separator = tag(:span, options[:separator], class: "separator")

        html.join(" #{separator} ")
      end

      def render_item(item, i, size)
        text, url, options = *item
        options[:class] ||= ""

        css = []
        css << "first" if i == 0
        css << "last" if i == size - 1
        css << "item-#{i}"

        options[:class] << " #{css.join(" ")}"
        options[:class].gsub!(/^ *(.*?)$/, '\\1')

        wrap_item(url, CGI.escapeHTML(text), options)
      end
    end
  end

end
