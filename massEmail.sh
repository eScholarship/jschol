#! /bin/bash

set -o pipefail
set -o errtrace
set -o nounset
set -o errexit


DIR="$(cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $DIR

### Log file
NOW="$(date +"%Y%m%d")"
echo $NOW


ADMIN_LOG=mailLogs/admin_go4it_$NOW.log
AUTHOR_LOG=mailLogs/author_go4it_$NOW.log
#ADMIN_LOG=mailLogs/admin_preview_$NOW.log
#AUTHOR_LOG=mailLogs/author_preview_$NOW.log
### Email LBL

if [ -f "$ADMIN_LOG" ] 
then
	echo SKIPPING ADMIN Email
else
	echo Start - ADMIN Email
	touch $ADMIN_LOG
	#./tools/massEmail.rb stats-admins recent-hits mailTemplates/adminEmail-monthly.erb preview  &> $ADMIN_LOG
	./tools/massEmail.rb stats-admins recent-hits mailTemplates/adminEmail-monthly.erb go4it  &> $ADMIN_LOG
	echo DONE - ADMIN Email
fi

if [ -f "$AUTHOR_LOG" ] 
then
	echo SKIPPING AUTHOR Email
else
	echo Start - AUTHOR Email
	touch $AUTHOR_LOG
	#./tools/massEmail.rb authors recent-hits mailTemplates/authorEmail-monthly.erb preview  &> $AUTHOR_LOG
	./tools/massEmail.rb authors recent-hits mailTemplates/authorEmail-monthly.erb go4it  &> $AUTHOR_LOG
	echo DONE - AUTHOR Email
fi

#./tools/massEmail.rb authors recent-hits mailTemplates/authorEmail-monthly.erb bounceTest |& tee mailLogs/`date +"%Y%m%d"`_bounceTest.log
