#!/usr/bin/env ruby

 # Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

require 'open-uri'
require 'sanitize'
require 'test/unit'

class TestQuick < Test::Unit::TestCase

  def fetch(url)
    open(url) { |f| return f.read }
  end

  def fetchAndStrip(url)
    html = fetch(url)
    html = Sanitize.document(html, Sanitize::Config::RELAXED)
    return html
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

  def test_browse_campuses
    html = fetchAndStrip("http://localhost:4001/campuses")
    assert_match /UC Berkeley/, html
  end

  def test_browse_journals
    html = fetchAndStrip("http://localhost:4001/journals")
    assert_match /Berkeley Planning Journal/, html
  end

  def test_browse_campus_units
    html = fetchAndStrip("http://localhost:4001/ucla/units")
    assert_match /UCLA Civil and Environmental Engineering/, html
  end

  def test_item
    html = fetchAndStrip("http://localhost:4001/item/9j48n0p8")
    assert_match /China’s contingencies and globalisation/, html
    assert_match /pdfjs-cdl-wrapper/, html
  end

  def test_dept
    html = fetchAndStrip("http://localhost:4001/uc/uclalaw")
    assert_match /UCLA School of Law/, html
    assert /There are (\d+) publications/ =~ html
    assert $1.to_i > 10, "At least 10 docs should be in uclalaw"
  end

  def test_login
    html = fetchAndStrip("http://localhost:4001/login")
    assert_match /Redirecting to login page/, html
  end

  def test_content
    pdfData = fetch("http://localhost:4001/content/qt5563x8nf/qt5563x8nf.pdf")
    assert_match /Lead Toxicity/, pdfData
  end
end
