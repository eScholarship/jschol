#!/usr/bin/env ruby

 # Use bundler to keep dependencies local
require 'rubygems'
require 'bundler/setup'

require 'open-uri'
require 'uri'
require 'sanitize'
require 'test/unit'

require 'nokogiri'
require 'rest-client'
require 'addressable/uri'

# use the configured Puma port via the ENV PUMA_PORT if it exists, otherwise 
# default to 4001
PUMA_PORT = ENV['PUMA_PORT'] || '4001'
puts "PUMA_PORT=#{PUMA_PORT}"

# use the configured scheme via the ENV SCHEME if it exists, otherwise 
# default to http
SCHEME = ENV['SCHEME'] || 'http'
puts "SCHEME=#{SCHEME}"

# use the configured target via the ENV TARGET_HOST if it exists, otherwise 
# default to localhost
TARGET_HOST = ENV['TARGET_HOST'] || 'localhost'
puts "TARGET_HOST=#{TARGET_HOST}"

# use the configured url_params via the ENV URL_PARAMS if it exists, otherwise, 
# default to emptystring
URL_PARAMS = ENV['URL_PARAMS'] || ''

# use the configured S3_BUCKET via the ENV S3_BUCKET if it exists, otherwise,
# default to emptystring
S3_BUCKET = ENV['S3_BUCKET'] || ''

class TestQuick < Test::Unit::TestCase

  def fetch(url)
    URI.open(url) { |f| return f.read }
  end

  def fetchAndStrip(url)
    puts "fetching: #{url}"
    html = fetch(url)
    html = Sanitize.document(html, Sanitize::Config::RELAXED)
    return html
  end

  def test_home
    pdfData = fetch("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/?#{URL_PARAMS}")
    assert_match(/Open Access/, pdfData)
    assert_match(/Repository Holdings/, pdfData)
  end

  def test_search
    html = fetchAndStrip("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/search?q=china;#{URL_PARAMS}")
    assert_match(/Your search:.*china/, html)
    assert(/\b(\d+) results/ =~ html)
    assert $1.to_i > 10, "At least 10 docs should match 'china'"
  end

  def test_phrase_search
    html = fetchAndStrip("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/search?q=%22red%22;#{URL_PARAMS}")
    assert_match(/The Red Tea Detox/, html)
  end

  def test_unitStatic
    html = fetchAndStrip("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/uc/uclalaw/policyStatement?#{URL_PARAMS}")
    assert_match(/School of Law only publishes materials about/, html)
  end

  def test_rootStatic
    html = fetchAndStrip("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/aboutEschol?#{URL_PARAMS}")
    assert_match(/provides scholarly publishing/, html)
  end

  def test_browse_campuses
    html = fetchAndStrip("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/campuses?#{URL_PARAMS}")
    assert_match(/UC Berkeley/, html)
  end

  def test_browse_journals
    html = fetchAndStrip("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/journals?#{URL_PARAMS}")
    assert_match(/Berkeley Planning Journal/, html)
  end

  def test_browse_campus_units
    html = fetchAndStrip("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/ucla/units?#{URL_PARAMS}")
    assert_match(/UCLA Civil and Environmental Engineering/, html)
  end

  def test_browse_campus_journals
    html = fetchAndStrip("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/ucb/journals?#{URL_PARAMS}")
    assert_match(/Berkeley Scientific Journal/, html)
  end

  def test_itemMain
    html = fetchAndStrip("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/uc/item/9j48n0p8?#{URL_PARAMS}")
    assert_match(/China’s contingencies and globalisation/, html)
    assert_match(/pdfjs-cdl-wrapper/, html)
  end

  def test_itemNoParent
    if URL_PARAMS.to_s.strip.empty?
      html = fetchAndStrip("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/uc/item/7sg6571h?#{URL_PARAMS};")
      assert_match(/Lignin depletion enhances/i, html)
      assert_match(/pdfjs-cdl-wrapper/, html)
    else
      # this test is known to fail if you send an access key to Jschol, so, skipping it
      puts "URL_PARAMS present, skipping test_itemNoParent"
    end
  end

  def test_itemEmbargo
    html = fetchAndStrip("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/uc/item/1r38x195?#{URL_PARAMS}")
    assert_match(/under embargo until/, html)
    assert_no_match(/pdfjs-cdl-wrapper/, html)
  end

  def test_dept
    html = fetchAndStrip("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/uc/uclalaw?#{URL_PARAMS}")
    assert_match(/UCLA School of Law/, html)
    assert_match(/There are (\d\d+) publications/, html)
  end

  def test_journal
    html = fetchAndStrip("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/uc/ismrg_cisj/6/1?#{URL_PARAMS}")
    assert_match(/Repetition, Variation, and the Idea of Art in Renaissance Italy/, html)
  end

  def test_series
    html = fetchAndStrip("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/uc/anthropology_ucb_postprints?#{URL_PARAMS}")
    assert_match(/Founded in September 1901/, html)
  end

  def test_campus
    html = fetchAndStrip("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/uc/ucla?#{URL_PARAMS}")
    assert_match(/Discover UCLA scholarship/, html)
    assert_match(/UCLA Journals/, html)
  end

  def test_login
    html = fetchAndStrip("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/login?#{URL_PARAMS}")
    assert_match(/Redirecting to login page/, html)
  end

  def test_content
    pdfData = fetch("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/content/qt5563x8nf/qt5563x8nf.pdf?#{URL_PARAMS}")
    assert_match(/Lead Toxicity/, pdfData)
  end

  def test_search_escaping
    html = fetch("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/search?#{URL_PARAMS};q=%3C%2Fscript%3E%3CSCRipt%3Ealert(%27NOPE%27)%3C%2Fscript%3E")
    assert_no_match(/<SCRipt>/, html)
  end

  def test_author_search
    html = fetch("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/search?#{URL_PARAMS};q=author%3A%22Adelman%2C%20Irma%22")
    assert_match(/Food Security/, html)
  end

  def test_author_search_pagination
    html = fetch("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/search?#{URL_PARAMS};q=author%3A%22Brozen%2C%20Madeline%22")
    assert_match(/input type=\"hidden\" name=\"q\" value=\"author:&quot;Brozen, Madeline&quot;\"/, html)
  end

  def test_for_broken_images
    if URL_PARAMS.to_s.strip.empty?
      puts "Testing for broken images..."
      doc = Nokogiri::HTML(RestClient.get("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/uc/psf?#{URL_PARAMS}"))
      images = doc.search('img').map{ |img| img['src'] }
      if images.empty?
        puts "No images found at #{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}/uc/psf"
      else
        missing_images = []
        images.each do |i|
          # ensure the image URL is fully qualified, and skip any nulls that
          # Nokogir hands us, because it is very silly
          if i
            check_this_url = Addressable::URI.parse("#{SCHEME}://#{TARGET_HOST}:#{PUMA_PORT}") + i
            if ! URL_PARAMS.length
              check_this_url.query_values = [['access',URL_PARAMS.partition('=').last]]
            end
            # assert that the return status for each iamge URL is 200
            check_this = check_this_url.to_s
            puts " -> checking: #{check_this}"
            begin
              details = RestClient.get(check_this)
              assert_equal details.code, 200
            rescue RestClient::ExceptionWithResponse
              puts "ERR: missing image!"
              if (check_this.match(/localhost.*assets/))
                puts " - this is an assets URL, on localhost, the asset may not be in the S3 bucket you're using: #{S3_BUCKET}..."
                puts "   ...probably not an error, for a dev environment, ignoring"
                puts "   ...but you should RE-CHECK on prd to be sure"
                puts "   ...NOTE this test is not run on dev or stg, RestClient doesn't like using access keys"
              else
                # add this immage to our missing_images list
                missing_images.append(check_this)
              end
            end
          end
        end
      end
      assert_empty(missing_images)
    else
      # this test is known to fail if you send an access key to Jschol, so, skipping it
      puts "URL_PARAMS present, skipping test_for_broken_images"
    end
  end
end
