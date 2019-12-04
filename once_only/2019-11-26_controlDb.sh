#!/usr/bin/env bash

MACHINES="pub-submit2-dev pub-submit2-stg pub-submit2-prd"
NOTIFY="r.c.martin.haye@ucop.edu"
THIS_MACHINE=`hostname`
if [[ " $MACHINES " =~ " $THIS_MACHINE " ]]; then

  echo ""
  echo "This will copy the data from the controller dbs (queues, items, arks) to eschol5."
  echo ""
  read -p "Ready to proceed? " -r
  if [[ $REPLY =~ ^[Yy]$ ]]; then

    set -x           # Echo each command as it executes
    set -o pipefail  # trace ERR through pipes
    set -o errtrace  # trace ERR through 'time command' and other functions
    set -o nounset   ## set -u : exit the script if you try to use an uninitialised variable
    set -o errexit   ## set -e : exit the script if any statement returns a non-true return value

    # Stop controller
    #eye stop control

    # Dump the database contents
    echo "Dumping tables."
    cd ~/tmp
    /bin/sqlite3 /apps/eschol/erep/xtf/control/db/queues.db .dump > queues.dump.sql
    /bin/sqlite3 /apps/eschol/erep/xtf/control/db/arks.db .dump > arks.dump.sql

    # Form the SQL load file
    echo "" > control_load.sql
    echo "begin;" >> control_load.sql

    echo "LOCK TABLES arks WRITE, queues WRITE, messages WRITE, index_states WRITE;" >> control_load.sql
    echo "SET FOREIGN_KEY_CHECKS=0;" >> control_load.sql
    echo "delete from queues;" >> control_load.sql
    echo "delete from messages;" >> control_load.sql
    echo "delete from index_states;" >> control_load.sql
    echo "delete from arks;" >> control_load.sql

    egrep 'INSERT INTO "arks"' arks.dump.sql | sed 's/"//g' | sed 's/ark:\/*13030\///g' >> control_load.sql
    egrep 'INSERT INTO "items"' queues.dump.sql | sed 's/"items"/"queues"/' | sed 's/"//g' | sed 's/ark:\/*13030\///g' >> control_load.sql
    cat queues.dump.sql | /apps/eschol/jschol/once_only/sqlite3_newline_fix.py | \
      egrep -i 'INSERT INTO "indexStates"' |\
      sed 's/"indexStates"/"index_states"/' | \
      sed 's/"//g' | \
      sed 's/ark:\/*13030\///g' | \
      sed "s/Warning: ''/Warning: /g" | \
      sed 's/INSERT INTO/INSERT IGNORE INTO/g' | \
      sed "s/'''/'/g" >> control_load.sql

    echo "delete from queues where item_id not in (select id from arks);" >> control_load.sql
    echo "delete from messages where item_id not in (select id from arks);" >> control_load.sql
    echo "delete from index_states where item_id not in (select id from arks);" >> control_load.sql
    echo "SET FOREIGN_KEY_CHECKS=1;" >> control_load.sql
    echo "UNLOCK TABLES;" >> control_load.sql
    echo "commit;" >> control_load.sql

    /apps/eschol/bin/singleToMultiTrans.rb control_load.sql > control_load_combo.sql

    echo "Loading tables."
    mysql --defaults-extra-file=/apps/eschol/.passwords/jschol_dba_pw.mysql < control_load_combo.sql

    # Our work here is finished.
    echo "All done."
  fi

else

  echo "This script is meant to run only on these machines: $MACHINES"
  exit 2

fi
