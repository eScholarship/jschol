#!/usr/bin/env bash

MACHINES="pub-submit2-dev pub-submit2-stg"
NOTIFY="mahjabeen.yucekul@ucop.edu"
THIS_MACHINE=`hostname`
if [[ " $MACHINES " =~ " $THIS_MACHINE " ]]; then

  echo ""
  echo "This will copy the jschol data, index, dbs, and S3 bucket from prod to this machine."
  echo "Existing data on this machine will be blown away."
  echo ""
  echo "NOTE: Did you schedule appropriate Nagios downtime? Otherwise people will get notified!"
  echo ""
  read -p "Ready to proceed (and Nagios downtime scheduled, if appropriate)? " -r
  if [[ $REPLY =~ ^[Yy]$ ]]; then

    set -x           # Echo each command as it executes
    set -o pipefail  # trace ERR through pipes
    set -o errtrace  # trace ERR through 'time command' and other functions
    set -o nounset   ## set -u : exit the script if you try to use an uninitialised variable
    set -o errexit   ## set -e : exit the script if any statement returns a non-true return value

    # Notify somebody when this exits (cleanly or otherwise)
    function finish {
      echo "Notifying $NOTIFY."
      echo "Check the copy script." | mail -s "Copy script exited." $NOTIFY
    }
    trap finish EXIT

if [ "" ]; then
    # Stop all services on this machine
    eye stop all
    sleep 5

    # Synchronize lots of miscellaneous directories
    for dir in allStructReport \
               linkBack \
               oa_report \
               repec \
               erep/statistics \
               erep/xtf/bpRedirect \
               erep/xtf/dojRedirect \
               erep/xtf/ripCache \
               erep/xtf/stats; \
    do
      echo "Syncing $dir from prod."
      rsync -a --delete eschol@submit.escholarship.org:/apps/eschol/$dir/ /apps/eschol/$dir/
    done

    ############ JSCHOL ###########
    # Dump the local jschol database and back it up - maybe not needed
    ~/bin/backupJscholDb.sh

    # Dump the prod jschol database to a file.
    ssh eschol@submit.escholarship.org /bin/bash /apps/eschol/bin/backupJscholDb.sh --raw

    # Copy the db backup file from prod.
    PROD_FILE=`ssh eschol@submit.escholarship.org ls -t '/apps/eschol/eschol5/jschol/db_backup/raw_dump*' | head -1`
    scp eschol@submit.escholarship.org:$PROD_FILE /apps/eschol/tmp/jschol_db_fromprod.gz

    # Rebuild the jschol database on this machine
    ~/bin/restoreJscholDb.sh /apps/eschol/tmp/jschol_db_fromprod.gz --raw

    # Copy the contents of prod's S3 bucket to this env's S3 bucket
    DEV_OR_STG=`hostname | sed 's/pub-submit2*-//' | sed 's/-.*//'`
    /usr/bin/aws s3 sync --delete --exclude '*-logs/*' s3://pub-s3-prd/jschol/ s3://pub-s3-$DEV_OR_STG/jschol/
fi

    ######### OJS ############
    # Dump the local OJS database - just in case
    cd ~/apache/htdocs/ojs/eschol/utilities && ./backup.sh
    cd ~

    # Dump the prod OJS database to a file.
    ssh eschol@submit.escholarship.org /bin/bash -c "source ~/.bashrc; cd ~/apache/htdocs/ojs/eschol/utilities; ./backup.sh"

    # Copy the OJS files and db backup from prod. But not the .hg dir, since it includes our local backups of the db.
    cd ~
    rsync -a --delete --exclude '.hg' eschol@submit.escholarship.org:ojs/ ojs/

    # Clear the OJS cache
    find ~/apache/htdocs/ojs/cache -name '*.php' | xargs rm -f

    # Rebuild the OJS database on this machine
    cd ~/apache/htdocs/ojs/eschol/utilities && ./restore.sh
    cd ~

    # Sometimes the controller and preview daemon don't clean up their lock files. Do that
    # so they will restart cleanly later.
    #
    cd /apps/eschol/erep/xtf/control/logs
    if [ -f control.lock ]; then
      echo "Note: stale control.lock found (not fatal); removing it."
      rm control.lock
    fi
    if [ -f previewDaemon.lock ]; then
      echo "Note: stale previewDaemon.lock found (not fatal); removing it."
      rm previewDaemon.lock
    fi

    echo "Copying indexes from prod."
    cd /apps/eschol/erep/xtf
    TIMESTAMP=`date +%s`
    rm -rf indexes-from-prod
    mkdir -p indexes-from-prod/erep/clean-$TIMESTAMP/base
    # Have to do lazy separately, since it's through a sym link
    until rsync -a --delete eschol@submit.escholarship.org:erep/xtf/index/lazy/ indexes-from-prod/erep/clean-$TIMESTAMP/base/lazy/
    do
      echo "Retrying rsync"
      sleep 5
    done
    until rsync -a --delete --filter="- lazy" eschol@submit.escholarship.org:erep/xtf/index/ indexes-from-prod/erep/clean-$TIMESTAMP/base/
    do
      echo "Retrying rsync"
      sleep 5
    done
    mkdir -p indexes-from-prod/preview/clean-$TIMESTAMP/base
    until rsync -a --delete eschol@submit.escholarship.org:erep/xtf/preview-index/ indexes-from-prod/preview/clean-$TIMESTAMP/base/
    do
      echo "Retrying rsync"
      sleep 5
    done

    echo "Switching in new indexes."
    cd /apps/eschol/erep/xtf
    rm -rf old-indexes   # get rid of *very* old indexes
    if [ -d indexes ]; then mv indexes old-indexes; fi
    mv indexes-from-prod indexes

    # Copy the data from prod, over our current data dir. Delete anything
    # extraneous on this end.
    echo "Rsyncing data from prod, log at /apps/eschol/tmp/data_rsync.log."
    until rsync -av --delete eschol@submit.escholarship.org:erep/data/ /apps/eschol/erep/data/ > /apps/eschol/tmp/data_rsync.log
    do
      echo "Retrying rsync"
      sleep 5
    done

    # Start everything up
    eye start all

    # Blow away the old indexes.
    echo "Deleting old indexes."
    rm -rf /apps/eschol/erep/xtf/old-indexes

    # Our work here is finished.
    echo "All done."
  fi

else

  echo "This script is meant to run only on these machines: $MACHINES"
  exit 2

fi
