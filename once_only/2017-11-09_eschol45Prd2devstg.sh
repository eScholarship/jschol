#!/usr/bin/env bash

MACHINES="pub-submit-dev pub-submit-stg-2a pub-submit-stg-2c"
THIS_MACHINE=`hostname`
if [[ " $MACHINES " =~ " $THIS_MACHINE " ]]; then

  echo ""
  echo "This will copy the eschol 4 & 5 data, index, controller dbs, and mysql dbs from prod to this machine."
  echo "Existing data, indexes, and dbs on this machine will be blown away."
  echo "Controller will be taken down for the duration, Apache, Tomcat, and other services will be brought"
  echo "down at various points, and restarted when appropriate."
  echo ""
  echo "NOTE: If this is stage, did you schedule a Nagios downtime? Otherwise people will get notified!"
  echo ""
  read -p "Ready to proceed (and Nagios downtime scheduled, if appropriate)? " -r
  if [[ $REPLY =~ ^[Yy]$ ]]; then

    # Stop if error occurs on any line
    set -e

    # Echo each command as it executes
    set -x

    # Synchronize lots of miscellaneous directories
    for dir in allStructReport \
               linkBack \
               oa_report \
               repec \
               erep/statistics \
               erep/xtf/bpRedirect \
               erep/xtf/dojRedirect \
               erep/xtf/ripCache \
               erep/xtf/stats \
               subi/pub-oapi \
               subi/pub-oapi-new \
               eschol5/jschol; \
    do
      echo "Syncing $dir from prod."
      rsync -a --delete eschol@submit.escholarship.org:/apps/eschol/$dir/ /apps/eschol/$dir/
    done

    ######### OJS ############
    # Dump the local OJS database and back it up in hg
    cd ~/apache/htdocs/ojs/eschol/utilities && ./backup.sh
    cd ~

    # Dump the prod OJS database to a file.
    ssh eschol@submit.escholarship.org /bin/bash -c "source ~/.bashrc; cd ~/apache/htdocs/ojs/eschol/utilities; ./backup.sh"

    # Copy the OJS files and db backup from prod. But not the .hg dir, since it includes our local backups of the db.
    cd ~
    rsync -a --delete --exclude '.hg' eschol@submit.escholarship.org:ojs/ ojs/

    ############ JSCHOL ###########
    # Dump the local jschol database and back it up in hg
    cd /apps/eschol/bin && ./backupJscholDb.sh
    cd ~

    # Dump the prod jschol database to a file.
    ssh eschol@submit.escholarship.org /bin/bash -c "source ~/.bashrc; cd /apps/eschol/bin; ./backupJscholDb.sh"

    # Copy the jschol files and db backup from prod. But not the .hg dir, since it includes our local backups of the db.
    cd ~
    rsync -a --delete --exclude '.git' eschol@submit.escholarship.org:jschol/db_backup/ jschol/db_backup/

    # Stop all services on this machine
    eye stop all
    sleep 5

    # Clear the OJS cache
    find ~/apache/htdocs/ojs/cache -name '*.php' | xargs rm -f

    # Rebuild the OJS database on this machine
    cd ~/apache/htdocs/ojs/eschol/utilities && ./restore.sh
    cd ~

    # Rebuild the jschol database on this machine
    cd ~/bin && ./restoreJscholDb.sh
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

    # Copy the controller databases (arks.db and queues.db) over from prod
    echo "Copying controller databases."
    cd /apps/eschol/erep/xtf/control/db
    scp eschol@submit.escholarship.org:erep/xtf/control/db/arks.db .
    scp eschol@submit.escholarship.org:erep/xtf/control/db/queues.db .

    # Copy the OAP database over from prod
    echo "Copying OAP database."
    cd ~/subi/oapImport
    rm -f oap.db
    scp eschol@submit.escholarship.org:subi/oapImport/oap.db .

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

    ### WE NEED TO SYNC THE JSCHOL S3 BUCKET
    # We can't access the production bucket (even for read-only) from dev and stg.
    # How?

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
