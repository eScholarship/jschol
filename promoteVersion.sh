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
    echo "promote-version.sh source-environment-name target-environment-name"
    exit 1
}

if [ $# -ne 2 ];
  then
    usage
fi

set -u

export TZ=":America/Los_Angeles"

echo "Getting VersionLabel from source environment..."
VERSION=$(aws elasticbeanstalk describe-environments \
    --environment-name $1 \
    | jq '.Environments[0].VersionLabel' | tr -d '"')

echo "version: ${VERSION}"

REGION=us-west-2
APPNAME=eb-pub-jschol2
S=$1
T=$2

# make sure target environment actually exists
echo "Checking target environment."
env_exists=$(aws elasticbeanstalk describe-environments --environment-name "$T" --no-include-deleted --region $REGION | jq '.Environments | length')

if [[ env_exists -ne 1 ]]
  then
    echo "target environment $T does not exist"
    usage
fi

echo "Promoting from source environment to target environment..."
echo "  version label: ${VERSION}"
echo "  source: ${S}"
echo "  target: ${T}"

# pause to confirm
echo "Please confirm you wish to promote the above version to the target environment."
read -p "You may continue by re-entering the target environment-name now: " target
case "$target" in
    $T ) echo "OK, we will proceed...";;
    * ) echo "Incorrect, aborting..." && exit 1;;
esac

# deploy app to a running environment
aws elasticbeanstalk update-environment \
  --environment-name "$T" \
  --region $REGION \
  --version-label "$VERSION"

# Wait for the deploy to complete.
echo "Waiting for deploy to finish."
PREV_DATETIME=""
while [[ 1 ]]; do
  STATUS_JSON=`aws elasticbeanstalk describe-events --environment-name "$T" --region $REGION --max-items 1`
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
if [[ "$T" =~ "-stg" ]]; then
  aws cloudfront create-invalidation --distribution-id E1PJWI7L2EBN0N --paths '/*'
elif [[ "$T" =~ "-prd" ]]; then
  aws cloudfront create-invalidation --distribution-id E1KER2WHN1RBOD --paths '/*'
fi

echo "Promotion complete."

exit 0

# Copyright (c) 2022, Regents of the University of California
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
