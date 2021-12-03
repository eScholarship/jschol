#!/usr/bin/env ruby

 # Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

require 'open-uri'
require 'sanitize'
require 'test/unit'

# use the configured Puma port via the ENV PUMA_PORT if it exists, otherwise default to 4001
PUMA_PORT = ENV['PUMA_PORT'] || '4001'
puts "PUMA_PORT=#{PUMA_PORT}"

# use the configured transport via the ENV TRANSPORT if it exists, otherwise default to http
TRANSPORT = ENV['TRANSPORT'] || 'http'
puts "TRANSPORT=#{TRANSPORT}"

# use the configured target via the ENV TARGET_HOST if it exists, otherwise default to localhost
TARGET_HOST = ENV['TARGET_HOST'] || 'localhost'
puts "TARGET_HOST=#{TARGET_HOST}"

class TestQuick < Test::Unit::TestCase

  def fetch(url)
    open(url) { |f| return f.read }
  end

  def fetchAndStrip(url)
    puts "fetching: #{url}"
    html = fetch(url)
    html = Sanitize.document(html, Sanitize::Config::RELAXED)
    return html
  end

  def test_home
    pdfData = fetch("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/")
    assert_match(/Open Access/, pdfData)
    assert_match(/Repository Holdings/, pdfData)
  end

  def test_search
    html = fetchAndStrip("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/search?q=china")
    assert_match(/Your search:.*china/, html)
    assert(/\b(\d+) results/ =~ html)
    assert $1.to_i > 10, "At least 10 docs should match 'china'"
  end

  def test_phrase_search
    html = fetchAndStrip("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/search?q=%22red%22")
    assert_match(/The Red Tea Detox/, html)
  end

  def test_unitStatic
    html = fetchAndStrip("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/uc/uclalaw/policyStatement")
    assert_match(/School of Law only publishes materials about/, html)
  end

  def test_rootStatic
    html = fetchAndStrip("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/aboutEschol")
    assert_match(/provides scholarly publishing/, html)
  end

  def test_browse_campuses
    html = fetchAndStrip("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/campuses")
    assert_match(/UC Berkeley/, html)
  end

  def test_browse_journals
    html = fetchAndStrip("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/journals")
    assert_match(/Berkeley Planning Journal/, html)
  end

  def test_browse_campus_units
    html = fetchAndStrip("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/ucla/units")
    assert_match(/UCLA Civil and Environmental Engineering/, html)
  end

  def test_browse_campus_journals
    html = fetchAndStrip("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/ucb/journals")
    assert_match(/Berkeley Scientific Journal/, html)
  end

  def test_itemMain
    html = fetchAndStrip("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/uc/item/9j48n0p8")
    assert_match(/China’s contingencies and globalisation/, html)
    assert_match(/pdfjs-cdl-wrapper/, html)
  end

  def test_itemNoParent
    html = fetchAndStrip("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/uc/item/7sg6571h")
    assert_match(/Lignin depletion enhances/i, html)
    assert_match(/pdfjs-cdl-wrapper/, html)
  end

  def test_itemEmbargo
    html = fetchAndStrip("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/uc/item/1r38x195")
    assert_match(/under embargo until/, html)
    assert_no_match(/pdfjs-cdl-wrapper/, html)
  end

  def test_dept
    html = fetchAndStrip("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/uc/uclalaw")
    assert_match(/UCLA School of Law/, html)
    assert_match(/There are (\d\d+) publications/, html)
  end

  def test_journal
    html = fetchAndStrip("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/uc/ismrg_cisj/6/1")
    assert_match(/Repetition, Variation, and the Idea of Art in Renaissance Italy/, html)
  end

  def test_series
    html = fetchAndStrip("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/uc/anthropology_ucb_postprints")
    assert_match(/Founded in September 1901/, html)
  end

  def test_campus
    html = fetchAndStrip("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/uc/ucla")
    assert_match(/Discover UCLA scholarship/, html)
    assert_match(/UCLA Journals/, html)
  end

  def test_login
    html = fetchAndStrip("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/login")
    assert_match(/Redirecting to login page/, html)
  end

  def test_content
    pdfData = fetch("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/content/qt5563x8nf/qt5563x8nf.pdf")
    assert_match(/Lead Toxicity/, pdfData)
  end

  def test_search_escaping
    html = fetch("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/search?q=%3C%2Fscript%3E%3CSCRipt%3Ealert(%27NOPE%27)%3C%2Fscript%3E")
    assert_no_match(/<SCRipt>/, html)
  end

  def test_author_search
    html = fetch("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/search?q=author%3A%22Adelman%2C%20Irma%22")
    assert_match(/Food Security/, html)
  end

  def test_author_search_pagination
    html = fetch("#{TRANSPORT}://#{TARGET_HOST}:#{PUMA_PORT}/search?q=author%3A%22Brozen%2C%20Madeline%22")
    assert_match(/input type=\"hidden\" name=\"q\" value=\"author:&quot;Brozen, Madeline&quot;\"/, html)
  end

end
