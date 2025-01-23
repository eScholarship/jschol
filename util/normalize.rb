#!/usr/bin/env ruby

# Normalization functions used by other modules

# Transliteration tables -- a cheesy but easy way to remove accents without requiring a Unicode gem
$transFrom = "ÀÁÂÃÄÅàáâãäåĀāĂăĄąÇçĆćĈĉĊċČčÐðĎďĐđÈÉÊËèéêëĒēĔĕĖėĘęĚěĜĝĞğĠġĢģĤĥĦħÌÍÎÏìíîïĨĩĪīĬĭĮįİıĴĵĶķĸĹĺĻļĽ" +
             "ľĿŀŁłÑñŃńŅņŇňŉŊŋÒÓÔÕÖØòóôõöøŌōŎŏŐőŔŕŖŗŘřŚśŜŝŞşŠšſŢţŤťŦŧÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųŴŵÝýÿŶŷŸŹźŻżŽž"
$transTo   = "AAAAAAaaaaaaAaAaAaCcCcCcCcCcDdDdDdEEEEeeeeEeEeEeEeEeGgGgGgGgHhHhIIIIiiiiIiIiIiIiIiJjKkkLlLlL" +
             "lLlLlNnNnNnNnnNnOOOOOOooooooOoOoOoRrRrRrSsSsSsSssTtTtTtUUUUuuuuUuUuUuUuUuUuWwYyyYyYZzZzZz"

###################################################################################################
# Remove accents from a string
def transliterate(str)
  str.tr($transFrom, $transTo)
end

###################################################################################################
# Convert to lower case, remove HTML-like elements, strip out weird characters, normalize spaces.
def normalize(str)
  str or return ''
  # NO: tmp = transliterate(str)  # This is dangerous: strips out accents in titles and author names!
  tmp = str.gsub(/&lt[;,]/, '<').gsub(/&gt[;,]/, '>').gsub(/&#?\w+[;,]/, '')
  tmp = tmp.gsub(/<[^>]+>/, ' ').gsub(/\\n/, ' ')
  tmp = tmp.gsub(/[|]/, '')
  tmp = tmp.gsub(/\s\s+/,' ').strip
  return tmp
end

###################################################################################################
# Special normalization for ERC metadata
def normalizeERC(str)
  return transliterate(normalize(str)).encode('ascii', replace: '.')
end
