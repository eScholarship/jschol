# Data Refresh

The following are instructions for performing data refresh for eScholarship data from production to stage/dev. The data refresh includes jschol and OJS databases, escholarship pairtree and S3 buckets.

# Steps
1. Make a copy an earlier data refresh script 
2. Review and update as appropriate
3. Run the script on submit dev/stage

# Known issues
S3 sync succeeds partially and that is expected. Most of the S3 items are created with the same permission/acl that the script is executed from. A few items are created with different permission setting due to CMS upload functionality. As a result the the data refresh script stops after S3 sync. Please review the log file and then rerun srcipt to resume after s3 sync step.

Before running the script work with IAS colleagues to ensure the jschol DB has provisioned I/O setting to avoid getting in zero I/O burst credit balance that can stall the DB restore process. 
