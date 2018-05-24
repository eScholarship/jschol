require "parslet"
require 'parslet/convenience' # For debugging:  parser.parse_with_debug(input)
require "pp"

# Parses strings like "author:schiff AND (title:twain OR title:melvyl)"
# respecting operator precedence and parentheses.
# Based on https://github.com/kschiess/parslet/blob/master/example/boolean_algebra.rb
# DOES NOT handle booleans within a field definition
#   i.e. "author:schiff AND title:(twain OR melvyl)". <-- This breaks the parser

string1 = "author:schiff AND (title:twain OR title:melvyl)"
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

  rule(:op) { str('AND') | str('OR') | str('NOT') }

  # rule(:var) { str("var") >> match["0-9"].repeat(1).as(:var) >> space? }
  #rule(:var) { match('[^()]').repeat(1).as(:var) >> space? }
  rule(:var) { op.absent? >> match('[^()\s]').repeat(1).as(:var) >> space?  }


  # rule(:var) { space? >> match('(foo|bar|boo)') >> space? }
  # rule(:var) { match('(AND|OR)').absent?.as(:var) }

  # The primary rule deals with parentheses.
  rule(:primary) { lparen >> or_operation >> rparen | var }

  # Note that following rules are both right-recursive.
  rule(:and_operation) { 
    (primary.as(:left) >> and_operator >> and_operation.as(:right)).as(:and) | primary }
    
  rule(:or_operation)  { 
    (and_operation.as(:left) >> or_operator >> or_operation.as(:right)).as(:or) | and_operation }

  # We start at the lowest precedence rule.
  root(:or_operation)
end

class Transformer < Parslet::Transform
  rule(:var => simple(:var)) { [[String(var)]] }

  rule(:or => { :left => subtree(:left), :right => subtree(:right) }) do
    (left + right)
  end

  rule(:and => { :left => subtree(:left), :right => subtree(:right) }) do
     res = []
     left.each do |l|
       right.each do |r|
         res << (l + r)
       end
     end
     res
  end
end

begin
  tree = QueryParser.new.parse_with_debug(string1)
  # tree = QueryParser.new.parse(string1)
  pp tree
rescue Parslet::ParseFailed => error
  pp string1
end

# {:and=>
#   {:left=>{:var=>"1"@3},
#    :right=>{:or=>{:left=>{:var=>"2"@13}, :right=>{:var=>"3"@21}}}}}
pp Transformer.new.apply(tree)
# [["1", "2"], ["1", "3"]]
