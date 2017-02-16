#!/usr/bin/env ruby

 # Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

require 'open-uri'
require 'sanitize'
require 'test/unit'

class TestQuick < Test::Unit::TestCase
 
 	def fetchAndStrip(url)
 		open(url) { |f| 
 			html = f.read
	 		html = Sanitize.document(html, Sanitize::Config::RELAXED)
 			return html
 		}
 	end

  def test_search
  	html = fetchAndStrip("http://localhost:4001/search?q=china")
  	assert_match /Your search:.*china/, html
  	assert /Results: [^<]*?(\d+) works/ =~ html
  	assert $1.to_i > 10, "At least 10 docs should match 'china'"
  end

  def test_static
  	html = fetchAndStrip("http://localhost:4001/static/root/aboutEschol")
  	assert_match /About eScholarship/, html
	end

  def test_browse
  	html = fetchAndStrip("http://localhost:4001/browse/campuslist")
  	assert_match /UC Berkeley/, html
	end

	def test_item
  	html = fetchAndStrip("http://localhost:4001/item/9j48n0p8")
  	assert_match /China’s contingencies and globalisation/, html
  	assert_match /pdfjs-cdl-wrapper/, html
	end

	def test_dept
  	html = fetchAndStrip("http://localhost:4001/unit/uclalaw")
  	assert_match /UCLA School of Law/, html
  	assert /There are (\d+) publications/ =~ html
  	assert $1.to_i > 10, "At least 10 docs should be in uclalaw"
	end

	def test_login
  	html = fetchAndStrip("http://localhost:4001/login")
  	assert_match /User name/, html
  end

end