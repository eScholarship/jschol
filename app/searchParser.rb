require "parslet"
require 'parslet/convenience' # For debugging:  parser.parse_with_debug(input)
require "pp"

# Parses strings like "author:schiff AND (title:twain OR title:melvyl)"
# respecting operator precedence and parentheses.
# Based on https://github.com/kschiess/parslet/blob/master/example/boolean_algebra.rb
# DOES NOT handle booleans within a field definition
#   i.e. "author:schiff AND title:(twain OR melvyl)". <-- This breaks the parser
string1 = 'author:"Schiff, Lisa R" AND NOT title:melvyl'
# string1 = '(author:"Schiff, Lisa R" AND (title:"twain harte" OR title:melvyl))'
# string1 = "author:schiff AND (title:twain OR title:melvyl)"
# Will translate to this: 
#   (and (term field='authors' 'schiff')
#        (or (term field='title' 'melvyl') (term field='title' 'twain')))

class QueryParser < Parslet::Parser
  rule(:space)  { match[" "].repeat(1) }
  rule(:space?) { space.maybe }

  rule(:lparen) { str("(") >> space? }
  rule(:rparen) { str(")") >> space? }

  rule(:and_operator) { str("AND") >> space? }
  rule(:or_operator)  { str("OR")  >> space? }
  rule(:not_operator)  { str("NOT")  >> space? }
  rule(:op) { and_operator | or_operator | not_operator }

  rule(:qstr) { op.absent? >> match('[^()\s]').repeat(1) >> space? }
  rule(:phrase) { qstr.repeat(1).as(:phrase) }
  rule(:title) { str("title") >> str(":") >> phrase.as(:title) }
  rule(:author) { str("author") >> str(":") >> phrase.as(:author) }
  rule(:incl) { phrase | title | author }
  rule(:excl) { (not_operator >> incl).as(:excl) }

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

class Transformer < Parslet::Transform  
  rule(:phrase => simple(:phrase)) {
    p = String(phrase).strip
    if p =~ /title:(.+)/
      "(term field='title' '#{$1.gsub(/"/, '')}')"
    elsif p =~ /author:(.+)/
      "(term field='authors' '#{$1.gsub(/"/, '')}')"
    else
      p
    end
  }
end

begin
  tree = QueryParser.new.parse_with_debug(string1)
  # tree = QueryParser.new.parse(string1)
  pp tree
rescue Parslet::ParseFailed => error
  pp string1
end

pp Transformer.new.apply(tree)
