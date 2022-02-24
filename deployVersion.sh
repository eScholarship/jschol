#!/usr/bin/env bash

DEBUG=
if [[ -n "$DEBUG" ]]; then
  set -x
fi

set -o pipefail  # trace ERR through pipes
set -o errtrace  # trace ERR through 'time command' and other functions
set -o nounset   ## set -u : exit the script if you try to use an uninitialised variable
set -o errexit   ## set -e : exit the script if any statement returns a non-true return value

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" # http://stackoverflow.com/questions/59895
cd $DIR

usage(){
    echo "deploy-version.sh environment-name"
    exit 1
}

if [ $# -ne 1 ];
  then
    usage
fi

set -u

export TZ=":America/Los_Angeles"
VERSION=`date -Iseconds`
VERSION+='--'
VERSION+=`git rev-parse --short HEAD`
DIR=jschol
BUCKET=cdlpub-apps
REGION=us-west-2
APPNAME=eb-pub-jschol2

# make sure we don't push non-prd branch to prd
CUR_BRANCH=`git rev-parse --abbrev-ref HEAD`
if [[ "$1" == *"prd"* && "$CUR_BRANCH" != "prd" ]]; then
  echo "Sanity check: should only push prd branch to prd environment."
  exit 1
fi

# make sure environment actually exists
echo "Checking environment."
env_exists=$(aws elasticbeanstalk describe-environments \
  --environment-name "$1" \
  --no-include-deleted \
  --region $REGION \
  | egrep -c 'Status.*Ready')

if [[ env_exists -ne 1 ]]
  then
    echo "environment $1 does not exist"
    usage
fi

# Make sure we have the right packages.
if [ -d node_modules.full ]; then mv node_modules.full node_modules; fi
npm install

# Pretranslate all the CSS
echo "Building app."
./node_modules/.bin/gulp sass

# Build the app (transpile, uglify, etc.) so it doesn't have to be built on each worker
if [[ "$1" =~ "-dev" ]]; then
  ./node_modules/.bin/webpack --config webpack.dev.js
else
  ./node_modules/.bin/webpack --config webpack.prd.js
fi

# package app and upload
echo "Packaging app."
mkdir -p dist
ZIP="$DIR-$VERSION.zip"
git ls-files -x app | xargs zip -ry dist/$ZIP   # picks up mods in working dir, unlike 'git archive'
mv node_modules node_modules.full
npm install --production
zip -r dist/$ZIP app/js app/css node_modules
rm -rf node_modules
mv node_modules.full node_modules
git checkout package-lock.json

# add the temporary overlay files
rm -rf tmp/app
mkdir -p tmp/app
cp -r overlay_files/* tmp/app/
cd tmp
zip -r ../dist/$ZIP app/
rm -rf tmp/app
cd ..

aws s3 cp dist/$ZIP s3://$BUCKET/$DIR/$ZIP

echo "Deploying."
aws elasticbeanstalk create-application-version \
  --application-name $APPNAME \
  --region $REGION \
  --source-bundle S3Bucket=$BUCKET,S3Key=$DIR/$ZIP \
  --version-label "$VERSION"

# deploy app to a running environment
aws elasticbeanstalk update-environment \
  --environment-name "$1" \
  --region $REGION \
  --version-label "$VERSION"

# Wait for the deploy to complete.
echo "Waiting for deploy to finish."
PREV_DATETIME=""
while [[ 1 ]]; do
  STATUS_JSON=`aws elasticbeanstalk describe-events --environment-name "$1" --region $REGION --max-items 1`
  DATETIME=`echo "$STATUS_JSON" | jq '.Events[0].EventDate' | sed 's/"//g'`
  MSG=`echo "$STATUS_JSON" | jq '.Events[0].Message' | sed 's/"//g'`
  if [[ "$PREV_DATETIME" != "$DATETIME" ]]; then
    PREV_DATETIME="$DATETIME"
    echo "$DATETIME: $MSG"
    if [[ "$MSG" =~ "update completed" ]]; then break; fi
  fi
  sleep 5
done

# Invalidate the CloudFront cache
echo "Invalidating CloudFront cache."
if [[ "$1" =~ "-stg" ]]; then
  aws cloudfront create-invalidation --distribution-id E1PJWI7L2EBN0N --paths '/*'
elif [[ "$1" =~ "-prd" ]]; then
  aws cloudfront create-invalidation --distribution-id E1KER2WHN1RBOD --paths '/*'
fi

echo "Deployment complete."

# Copyright (c) 2019, Regents of the University of California
#
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are
# met:
#
# - Redistributions of source code must retain the above copyright notice,
#   this list of conditions and the following disclaimer.
# - Redistributions in binary form must reproduce the above copyright
#   notice, this list of conditions and the following disclaimer in the
#   documentation and/or other materials provided with the distribution.
# - Neither the name of the University of California nor the names of its
#   contributors may be used to endorse or promote products derived from
#   this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
# ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
# LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
# CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
# SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
# INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
# CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
# ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
# POSSIBILITY OF SUCH DAMAGE.
