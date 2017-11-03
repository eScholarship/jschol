# API for login/logout support

require 'openssl'
require 'digest/sha1'
require 'base64'
require 'uri'
require 'date'

###################################################################################################
# Begin the login process by creating a session ID and a session record in the OJS database
get "/api/loginStart" do
  # Invent a random session key (nonce)
  nonce = SecureRandom.uuid.gsub("-", "")  # Guid, without the dashes
  nonce =~ /^\w{32}$/ or raise("Invalid GUID generated")
  time = Time.new
  OJS_DB[:sessions].insert(session_id: nonce,
                           user_id: nil,
                           ip_address: request.ip,
                           user_agent: request.user_agent,
                           created: time.to_i,
                           last_used: time.to_i,
                           remember: false,
                           data: nil,
                           acting_as: 0)
  content_type :json
  return JSON.generate({ header: getGlobalHeader, nonce: nonce})
end

###################################################################################################
# Finish up the login process by decrypting and recording the username.
get "/api/loginValidate" do
  nonce = params[:nonce]
  data = params[:data]

  # Ensure that this is the result of a recent session
  record = OJS_DB[:sessions].where(session_id: nonce).first
  record or raise("Invalid session ID")
  t = Time.at(record[:created])
  t && (Time.new - t) < 300 or raise("Took too long to log in")

  # Read the key and make it into a form suitable for the Cipher
  cipherKeyData = $jscholKey
  cipherKey = Digest::SHA1.hexdigest(cipherKeyData)

  # Set up the decryptor and give it the key and init vector
  cipher = OpenSSL::Cipher::Cipher.new("aes-256-ctr")
  cipher.decrypt
  cipher.key = cipherKey
  cipher.iv = nonce

  # Now decrypt the message
  encrypted = Base64.urlsafe_decode64(data)
  decryptedStr = cipher.update(encrypted)
  decryptedStr << cipher.final
  decrypted = JSON.parse(decryptedStr)

  username = decrypted["eppn"]
  #puts "DECRYPTED: #{decrypted.inspect}"

  # Record the username, plus user id if any, in the OJS database.
  OJS_DB.transaction do
    user = OJS_DB[:users].where(username: username).first
    nRows = OJS_DB[:sessions].where(session_id: nonce).update(
      user_id: user ? user[:user_id] : nil,
      data: username,
      last_used: Time.now.to_i)
    nRows == 1 or raise("Update failed: expected 1 row, update #{nRows} instead")
  end

  # And return the data
  content_type :json
  return JSON.generate({header: getGlobalHeader, username: username, key: params[:nonce]})
end

###################################################################################################
# Logout record keeping
get "/api/loginEnd" do
  content_type :json
  userID = getUserID(params[:username]) or return JSON.generate(permFail("invalid username"))
  sessionID = params[:token]
  sessionID =~ /^\w{32}$/ or return JSON.generate(permFail("invalid session ID"))
  OJS_DB[:sessions].where(user_id: userID, session_id: sessionID).delete
  return JSON.generate({ header: getGlobalHeader, message: "ok" })
end

###################################################################################################
def permFail(msg)
  puts "Permission failure: #{msg.inspect}"
  return { header: getGlobalHeader, error: true, message: msg }
end

###################################################################################################
def getUserID(username)
  username =~ /\w+/ or return nil  # at least two word chars in a row
  row = OJS_DB[:users].where(username: username).first
  row or return nil
  return row[:user_id].to_i
end

###################################################################################################
# Determine permissions based on username and key
def getUserPermissions(username, sessionID, unitID)

  # Validate the parameters
  userID = getUserID(username) or return permFail("invalid username")
  sessionID =~ /^\w{32}$/ or return permFail("invalid session ID")
  unit = $unitsHash[unitID] or return permFail("invalid unit ID")

  # Map the username to a user ID
  username =~ /\w+/ or return permFail("no username")  # at least two word chars in a row
  row = OJS_DB[:users].where(username: username).first
  row or return permFail("invalid username")
  userID = row[:user_id]

  # Make sure the login session is valid
  row = OJS_DB[:sessions].where(session_id: sessionID, user_id: userID).first
  row or return permFail("no matching session")
  (Time.now - Time.at(row[:last_used])) < (60*60) or return permFail("session expired")
  userID = row[:user_id]
  userID > 0 or return permFail("no user_id")

  # And update the time.
  OJS_DB[:sessions].where(session_id: sessionID, user_id: userID).update(last_used: Time.now.to_i)

  # Check for permissions
  if OJS_DB[:user_settings].where(user_id: userID, setting_name: 'eschol_superuser').first
    return { admin: true, super: true }
  elsif unit.type.include?("series")
    return {}  # disallow all actions on series until we get clone-fork in place
  elsif OJS_DB[:eschol_roles].where(user_id: userID, role: 'admin', unit_id: unitID).first
    return { admin: true }
  else
    return {}
  end
end

###################################################################################################
# Retrieve page permissions for the user's session
get "/api/permissions/:unitID" do |unitID|
  content_type :json

  # General permissions
  result = getUserPermissions(params[:username], params[:token], unitID)

  # Per-nav-item permissions
  unit = Unit[unitID]
  attrs = JSON.parse(unit.attrs)
  navPerms = {}
  result[:nav_perms] = getNavPerms(Unit[unitID], attrs["nav_bar"], result)

  # Return the combined info
  return JSON.generate(result)
end