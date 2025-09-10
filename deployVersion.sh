#!/usr/bin/env bash

DEBUG=
if [[ -n "$DEBUG" ]]; then
  set -x
fi

set -o pipefail  # trace ERR through pipes
set -o errtrace  # trace ERR through 'time command' and other functions
set -o nounset   ## set -u : exit the script if you try to use an uninitialised variable
set -o errexit   ## set -e : exit the script if any statement returns a non-true return value

# Validate required commands 
command -v aws >/dev/null 2>&1 || { echo >&2 "AWS CLI not found."; exit 1; } 
command -v git >/dev/null 2>&1 || { echo >&2 "Git not found."; exit 1; } 
command -v node-20 >/dev/null 2>&1 || { echo >&2 "node-20 not found."; exit 1; } 
command -v npm-20 >/dev/null 2>&1 || { echo >&2 "npm-20 not found."; exit 1; } 
command -v jq >/dev/null 2>&1 || { echo >&2 "jq not found."; exit 1; } 

# Validate AWS credentials 
if ! aws sts get-caller-identity > /dev/null 2>&1; then 
	echo "AWS credentials not valid." 
	exit 1 
fi

# Validate Node version is 20
NODE_VERSION=$(node-20 -v | awk -F'v' '{print $2}' | awk -F'.' '{print $1}')

# if NODE_VERSION is not equal to 20, exit
if [[ $NODE_VERSION != 20 ]]; then
  echo "Node version 20 is required."
  exit 1
fi

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
ENVNAME=$1

# make sure we don't push non-prd branch to prd
CUR_BRANCH=`git rev-parse --abbrev-ref HEAD`
if [[ "$ENVNAME" == *"prd"* && "$CUR_BRANCH" != "prd" ]]; then
  echo "Sanity check: should only push prd branch to prd environment.\n\nAND you should be using promote-version.sh to promote a tested version to prd.\n\nAborting..."
  exit 1
fi

# if we're trying to deploy to prd, nag and confirm
if [[ "$ENVNAME" == *"prd"* ]]; then
  echo "Sanity check: you should really only promote to prd using the promote-version.sh script.\n\n"
  read -p "If you know what you're doing, you may continue by re-entering the target environment-name now: " target
  case "$target" in
      $ENVNAME ) echo "\nOK, we will proceed...";;
      * ) echo "\nIncorrect, aborting..." && exit 1;;
  esac
fi

# make sure environment actually exists
echo "Checking environment."
env_exists=$(aws elasticbeanstalk describe-environments --environment-name "$ENVNAME" --no-include-deleted --region $REGION | jq '.Environments | length')

if [[ "$env_exists" -ne 1 ]]; then
    echo "environment $ENVNAME does not exist"
    usage
fi

# Make sure we have the right packages.
if [ -d node_modules.full ]; then mv node_modules.full node_modules; fi
npm-20 install

# Build the app (transpile, uglify, etc.) so it doesn't have to be built on each worker
echo "Building app."
if [[ "$ENVNAME" =~ "-dev" ]]; then
  NODE_ENV=development NODE_OPTIONS="--max-old-space-size=4096" npm-20 run build
else
  NODE_ENV=production NODE_OPTIONS="--max-old-space-size=4096" npm-20 run build
fi

# package app and upload
echo "Packaging app."
mkdir -p dist
ZIP="$DIR-$VERSION.zip"
git ls-files -x app | xargs zip -ry dist/$ZIP   # picks up mods in working dir, unlike 'git archive'
mv node_modules node_modules.full
npm-20 install --production
# include Vite build output and production node_modules
zip -r dist/$ZIP dist/client dist/server node_modules
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
  --environment-name "$ENVNAME" \
  --region $REGION \
  --version-label "$VERSION"

# Wait for the deploy to complete.
echo "Waiting for deploy to finish."
PREV_DATETIME=""
while [[ 1 ]]; do
  STATUS_JSON=`aws elasticbeanstalk describe-events --environment-name "$ENVNAME" --region $REGION --max-items 1`
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
if [[ "$ENVNAME" =~ "-stg" ]]; then
  aws cloudfront create-invalidation --distribution-id E1PJWI7L2EBN0N --paths '/*'
elif [[ "$ENVNAME" =~ "-prd" ]]; then
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
