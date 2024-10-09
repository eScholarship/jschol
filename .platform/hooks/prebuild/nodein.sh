#!/bin/bash

#app="$(/opt/elasticbeanstalk/bin/get-config container -k app_staging_dir)";
app = "/var/app/staging"
# install node 20 (and npm that comes with it)
echo "Trying to install node20.";
curl --silent --location https://rpm.nodesource.com/setup_20.x | grep -v sleep | bash -;
dnf -y install nodejs20
alternatives --install /usr/bin/node node /usr/bin/node-20 90
alternatives --install /usr/bin/npm npm /usr/bin/npm-20 90

# use npm to install the app's node modules
cd "${app}";
#echo "Running npm install.";
su webapp -c "npm install"
ln -s node_modules/.bin/gulp
ln -s node_modules/.bin/backstop
ln -s node_modules/.bin/webpack
