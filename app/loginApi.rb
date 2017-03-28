# API for login/logout support

require 'openssl'
require 'digest/sha1'
require 'base64'
require 'uri'
require 'date'

get "/api/loginStart" do
  # Invent a random session key (nonce)
  nonce = SecureRandom.uuid
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
  return JSON.generate({nonce: nonce})
end

get "/api/loginValidate" do
  nonce = params[:nonce]
  data = params[:data]

  # Ensure that this is the result of a recent session
  record = OJS_DB[:sessions].where(session_id: nonce).first
  record or raise("Invalid session ID")
  t = Time.at(record[:created])
  t && (Time.new - t) < 300 or raise("Took too long to log in")

  # Read the key and make it into a form suitable for the Cipher
  cipherKeyData = open("config/jscholKey.dat").read.strip
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

  # Record the username, plus user id if any, in the OJS database.
  OJS_DB.transaction do
    user = OJS_DB[:users].where(username: username).first
    nRows = OJS_DB[:sessions].where(session_id: nonce).update(user_id: user ? user[:user_id] : nil, data: username)
    nRows == 1 or raise("Update failed: expected 1 row, update #{nRows} instead")
  end

  # And return the data
  return JSON.generate({username: username, key: params[:nonce]})
end
