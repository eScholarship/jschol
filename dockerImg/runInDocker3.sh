#!/bin/bash

set -e

rsync -a --exclude run.sh --exclude .git --exclude bin --exclude config --exclude gems --exclude node_modules --exclude app/js --exclude app/css --exclude app/bower_components /outer_jschol/ ./

source config/config.env

mkdir -p ~/.ssh
pushd ~/.ssh
echo "$SSH_KEY" > id_rsa
chmod 600 id_rsa
chmod 700 .
popd

mkdir -p config

cat > config/database.yaml <<EOF
adapter: $ESCHOL_DB_ADAPTER
host: $ESCHOL_DB_HOST
port: $ESCHOL_DB_PORT
database: $ESCHOL_DB_DATABASE
username: $ESCHOL_DB_USERNAME
password: $ESCHOL_DB_PASSWORD
EOF

cat > config/jscholKey.dat <<EOF
$JSCHOL_KEY
EOF

cat > config/mrtExpress.yaml <<EOF
host: $MRTEXPRESS_HOST
username: $MRTEXPRESS_USERNAME
password: $MRTEXPRESS_PASSWORD
EOF

cat > config/ojsDb.yaml <<EOF
adapter: $OJS_DB_ADAPTER
host: $OJS_DB_HOST
port: $OJS_DB_PORT
database: $OJS_DB_DATABASE
username: $OJS_DB_USERNAME
password: $OJS_DB_PASSWORD
EOF

cat > config/s3.yaml <<EOF
region: $S3_REGION
bucket: $S3_BUCKET
prefix: $S3_PREFIX
EOF

cat > config/cloudSearch.yaml <<EOF
domain: $CLOUDSEARCH_DOMAIN
searchEndpoint: $CLOUDSEARCH_SEARCH_ENDPOINT
docEndpoint: $CLOUDSEARCH_DOC_ENDPOINT
EOF

cat > config/puma.rb <<EOF
workers $PUMA_WORKERS
port $JSCHOL_MAIN_PORT
on_worker_boot do |num|
  \$workerNum = num
  \$workerPrefix = num.to_s + "."
  \$nextThreadNum = 0
end
EOF

cat > config/server.yaml <<EOF
mainPort: $JSCHOL_MAIN_PORT
isoPort: $JSCHOL_ISO_PORT
isoWorkers: $ISO_WORKERS
EOF

[[ -n "$SOCKS_PORT" ]] && cat > config/socks.yaml <<EOF
port: $SOCKS_PORT
user: $SOCKS_USER
EOF

[[ -n "$CLOUDFRONT_PUBLIC_URL" ]] && cat > config/cloudFront.yaml <<EOF
public-url: $CLOUDFRONT_PUBLIC_URL
private-key: $CLOUDFRONT_PRIVATE_KEY
EOF

./setup.sh

echo ""
echo "== Starting gulp =="
mkdir -p app/css app/js  # if they "appear" gulp watch will mistakenly run
./gulp
