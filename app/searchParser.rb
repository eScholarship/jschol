require "parslet"
# require 'parslet/convenience' # For debugging:  parser.parse_with_debug(input)

# Parses strings like "author:schiff AND (title:twain OR title:melvyl)"
# respecting operator precedence and parentheses. Generates structured query
# for AWS Cloudsearch. Requires that terms/phrases are prepended with
# 'title:', 'author:', or 'keywords:', otherwise returns original query string

# Based on https://github.com/kschiess/parslet/blob/master/example/boolean_algebra.rb
# DOES NOT handle booleans within a field definition
#   i.e. "author:schiff AND title:(twain OR melvyl)". <-- This breaks the parser

# 'author: schiff OR (title:"twain harte" AND NOT title:melvyl)'
# Will translate to this: 
# (or (term field='author' 'schiff')
#   (and (phrase field='title' 'twain harte') (not (term field='title' 'melvyl'))))

# Can match 'AND' or 'and', etc
def stri(str)
  key_chars = str.split(//)
  key_chars.
    collect! { |char| match["#{char.upcase}#{char.downcase}"] }.
    reduce(:>>)
end

class QueryParser < Parslet::Parser
  rule(:space)  { match[" "].repeat(1) }
  rule(:space?) { space.maybe }

  rule(:lparen) { str("(") >> space? }
  rule(:rparen) { str(")") >> space? }

  rule(:and_operator) { stri("AND") >> space }
  rule(:or_operator)  { stri("OR")  >> space }
  rule(:not_operator)  { stri("NOT")  >> space }
  rule(:op) { and_operator | or_operator | not_operator }

  rule(:segment) { op.absent? >> match('[^()"\s]').repeat(1) >> space? }
  rule(:term) { segment.repeat(1).as(:term) }
  rule(:phrase) { str('"') >> segment.repeat(1).as(:phrase) >> str('"') >> space? }

  rule(:title) { str("title") >> str(":") >> space? >> (term|phrase).as(:title) }
  rule(:author) { str("author") >> str(":") >> space? >> (term|phrase).as(:author) }
  rule(:keywords) { str("keyword") >> str("s").maybe >> str(":") >> space? >> (term|phrase).as(:keywords) }
  rule(:incl) { title | author | keywords }
  rule(:excl) { not_operator >> incl.as(:excl) }

  # The primary rule deals with parentheses.
  rule(:primary) { lparen >> or_operation >> rparen | incl | excl }

  # Note that following rules are both right-recursive.
  rule(:and_operation) { 
    (primary.as(:left) >> and_operator >> and_operation.as(:right)).as(:and) | primary }
    
  rule(:or_operation)  { 
    (and_operation.as(:left) >> or_operator >> or_operation.as(:right)).as(:or) | and_operation }

  # We start at the lowest precedence rule.
  root(:or_operation)

end

def _clean(str)
  return String(str).strip.gsub(/'/, "\\\\'")
end

def _lastNameFirst(str)
  a = str.split
  if a.size > 1
    ln = "#{a.pop},"
    return a.unshift(ln).join(' ')
  end
  return str
end

class Transformer < Parslet::Transform
  rule(:title => { :term => simple(:term) }) do
    "(term field='title' '#{_clean(term)}')"
  end
  rule(:title => { :phrase => simple(:phrase) }) do
    "(phrase field='title' '#{_clean(phrase)}')"
  end

  # Force any queries on author to be phrase queries.
  # If no comma, re-arrange name to have last name first
  rule(:author => { :term => simple(:term) }) do
    r = _clean(term)
    "(phrase field='authors' '#{r =~ /,/ ? r : _lastNameFirst(r)}')"
  end
  rule(:author => { :phrase => simple(:phrase) }) do
    "(phrase field='authors' '#{_clean(phrase)}')"
  end

  rule(:keywords => { :term => simple(:term) }) do
    "(term field='keywords' '#{_clean(term)}')"
  end
  rule(:keywords => { :phrase => simple(:phrase) }) do
    "(phrase field='keywords' '#{_clean(phrase)}')"
  end

  rule(:excl => subtree(:excl)) do
    "(not " + excl + ")"
  end

  rule(:and => { :left => subtree(:left), :right => subtree(:right) }) do
    "(and " + left + " " + right + ")"
  end
  rule(:or => { :left => subtree(:left), :right => subtree(:right) }) do
    "(or " + left + " " + right + ")"
  end

  rule(:left => subtree(:left)) { "(" + left + ")" }
  rule(:left => simple(:left)) { left }
  rule(:right => subtree(:right)) { "(" + right + ")" }
  rule(:right => simple(:right)) { right }

end

def q_structured(q)
  begin
    # View parsed tree:
    # tree = QueryParser.new.parse_with_debug(q)
    tree = QueryParser.new.parse(q)
  rescue Parslet::ParseFailed => error
    puts error.parse_failure_cause.ascii_tree
    return false, q
  end
  return true, Transformer.new.apply(tree)
end
