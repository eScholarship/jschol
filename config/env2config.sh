#!/bin/bash

set -e

cd `dirname $0`

cat > jscholKey.dat <<EOF
$JSCHOL_KEY
EOF

cat > mrtExpress.yaml <<EOF
host: $MRTEXPRESS_HOST
username: $MRTEXPRESS_USERNAME
password: $MRTEXPRESS_PASSWORD
EOF

cat > s3.yaml <<EOF
region: $S3_REGION
bucket: $S3_BUCKET
prefix: $S3_PREFIX
EOF

cat > cloudSearch.yaml <<EOF
domain: $CLOUDSEARCH_DOMAIN
searchEndpoint: $CLOUDSEARCH_SEARCH_ENDPOINT
docEndpoint: $CLOUDSEARCH_DOC_ENDPOINT
EOF

cat > puma.rb <<EOF
workers $PUMA_WORKERS
port $PUMA_PORT
on_worker_boot do |num|
  \$workerNum = num
  \$workerPrefix = num.to_s + "."
  \$nextThreadNum = 0
end
EOF

cat > server.yaml <<EOF
mainPort: $PUMA_PORT
isoPort: $ISO_PORT
isoWorkers: $ISO_WORKERS
EOF

[[ -n "$SOCKS_PORT" ]] && cat > socks.yaml <<EOF
port: $SOCKS_PORT
user: $SOCKS_USER
target: $SOCKS_TARGET
bastion: $SOCKS_BASTION
bastionPort: $SOCKS_BASTION_PORT
EOF

[[ -n "$CLOUDFRONT_PUBLIC_URL" ]] && cat > cloudFront.yaml <<EOF
public-url: $CLOUDFRONT_PUBLIC_URL
private-key: $CLOUDFRONT_PRIVATE_KEY
EOF
