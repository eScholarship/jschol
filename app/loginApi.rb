# API for login/logout support

require 'openssl'
require 'digest/sha1'
require 'base64'
require 'uri'

get "/api/loginStart" do
  # Invent a random session key (nonce)
  nonce = SecureRandom.uuid
  return JSON.generate({nonce: nonce})
end

get "/api/loginValidate" do
  # Read the key and make it into a form suitable for the Cipher
  cipherKeyData = open("#{ENV['HOME']}/.passwords/jscholKey.dat").read.strip
  cipherKey = Digest::SHA1.hexdigest(cipherKeyData)

  puts "nonce=#{params[:nonce].inspect}"
  puts "data=#{params[:data].inspect}"

  # Set up the decryptor and give it the key and init vector
  cipher = OpenSSL::Cipher::Cipher.new("aes-256-ctr")
  cipher.decrypt
  cipher.key = cipherKey
  cipher.iv = params[:nonce]

  # Now decrypt the message
  encrypted = Base64.urlsafe_decode64(params[:data])
  decryptedStr = cipher.update(encrypted)
  decryptedStr << cipher.final
  puts "decryptedStr: #{decryptedStr}"
  decrypted = JSON.parse(decryptedStr)
  puts "decrypted: #{decrypted.inspect}"
  puts "eppn: #{decrypted["eppn"].inspect}"

  return JSON.generate({username: decrypted["eppn"], key: params[:nonce]})
end
