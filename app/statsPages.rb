# API data for unit and author stats pages

def statsData(pageName)
  puts "statsData: pageName=#{pageName}"
  return { todo: true }.to_json
end