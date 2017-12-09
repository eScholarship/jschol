#!/usr/bin/env bash

MACHINES="pub-submit-stg-2a pub-submit-stg-2c"
THIS_MACHINE=`hostname`
if [[ " $MACHINES " =~ " $THIS_MACHINE " ]]; then

  echo ""
  echo "This will copy the eschol 5 db and S3 data from prod to this machine."
  echo "Existing data on this machine will be blown away."
  echo ""
  echo "NOTE: Did you schedule appropriate Nagios downtime? Otherwise people will get notified!"
  echo ""
  read -p "Ready to proceed (and Nagios downtime scheduled, if appropriate)? " -r
  if [[ $REPLY =~ ^[Yy]$ ]]; then

    # Stop if error occurs on any line
    set -e

    # Echo each command as it executes
    set -x

    ############ JSCHOL ###########
    # Dump the local jschol database and back it up
    ~/bin/backupJscholDb.sh

    # Dump the prod jschol database to a file.
    ssh eschol@submit.escholarship.org /bin/bash /apps/eschol/bin/backupJscholDb.sh

    # Copy the db backup file from prod.
    PROD_FILE=`ssh eschol@submit.escholarship.org ls -t '/apps/eschol/eschol5/jschol/db_backup/dump*' | head -1`
    scp eschol@submit.escholarship.org:$PROD_FILE /apps/eschol/tmp/jschol_db_fromprod.gz

    # Rebuild the jschol database on this machine
    ~/bin/restoreJscholDb.sh /apps/eschol/tmp/jschol_db_fromprod.gz

    # Copy the contents of prod's S3 bucket to this machine
    DEV_OR_STG=`hostname | sed 's/pub-submit-//' | sed 's/-.*//'`
    /usr/bin/aws s3 sync --delete --quiet --exclude '*-logs/*' s3://pub-s3-prd/jschol/ s3://pub-s3-$DEV_OR_STG/jschol/

    # Our work here is finished.
    echo "All done."

  fi

else

  echo "This script is meant to run only on these machines: $MACHINES"
  exit 2

fi
