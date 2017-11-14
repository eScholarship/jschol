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

  def test_home
    pdfData = fetch("http://localhost:4001/")
    assert_match /Open Access/, pdfData
    assert_match /Repository Holdings/, pdfData
  end

  def test_search
    html = fetchAndStrip("http://localhost:4001/search?q=china")
    assert_match /Your search:.*china/, html
    assert /\b(\d+) results/ =~ html
    assert $1.to_i > 10, "At least 10 docs should match 'china'"
  end

  def test_unitStatic
    html = fetchAndStrip("http://localhost:4001/uc/uclalaw/policyStatement")
    assert_match /School of Law only publishes materials about/, html
  end

  def test_rootStatic
    html = fetchAndStrip("http://localhost:4001/aboutEschol")
    assert_match /provides scholarly publishing/, html
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

  def test_browse_campus_journals
    html = fetchAndStrip("http://localhost:4001/ucb/journals")
    assert_match /Berkeley Scientific Journal/, html
  end

  def test_itemMain
    html = fetchAndStrip("http://localhost:4001/uc/item/9j48n0p8")
    assert_match /China’s contingencies and globalisation/, html
    assert_match /pdfjs-cdl-wrapper/, html
  end

  def test_itemNoParent
    html = fetchAndStrip("http://localhost:4001/uc/item/7sg6571h")
    assert_match /Lignin depletion enhances/, html
    assert_match /pdfjs-cdl-wrapper/, html
  end

  def test_itemEmbargo
    html = fetchAndStrip("http://localhost:4001/uc/item/1r38x195")
    assert_match /under embargo until/, html
    assert_no_match(/pdfjs-cdl-wrapper/, html)
  end

  def test_dept
    html = fetchAndStrip("http://localhost:4001/uc/uclalaw")
    assert_match /UCLA School of Law/, html
    assert_match /There are (\d\d+) publications/, html
  end

  def test_journal
    html = fetchAndStrip("http://localhost:4001/uc/ismrg_cisj/6/1")
    assert_match /Repetition, Variation, and the Idea of Art in Renaissance Italy/, html
  end

  def test_series
    html = fetchAndStrip("http://localhost:4001/uc/anthropology_ucb_postprints")
    assert_match /Founded in September 1901/, html
    assert_match /Oikos\/Anthropos: Rationality, Technology, Infrastructure/, html
  end

  def test_campus
    html = fetchAndStrip("http://localhost:4001/uc/ucla")
    assert_match /Discover UCLA scholarship/, html
    assert_match /UCLA Journals/, html
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
