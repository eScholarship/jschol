#!/bin/bash
echo "Trying to install node.";

#app="$(/opt/elasticbeanstalk/bin/get-config container -k app_staging_dir)";
app = "/var/app/staging"
# install node 10 (and npm that comes with it)
curl --silent --location https://rpm.nodesource.com/setup_10.x | bash -;
sudo yum -y install nodejs

# use npm to install the app's node modules
cd "${app}";
#echo "Running npm install.";
su webapp -c "npm install"
ln -s node_modules/.bin/gulp
ln -s node_modules/.bin/backstop
ln -s node_modules/.bin/webpack
