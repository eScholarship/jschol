set -e

rm -rf lib
mkdir -p lib downloaded
cd downloaded
echo "Downloading iText."
wget --timestamping --no-verbose https://github.com/itext/itext7/releases/download/7.0.4/itext7-7.0.4.zip
echo "Downloading slf4j."
wget --timestamping --no-verbose https://www.slf4j.org/dist/slf4j-1.7.25.tar.gz
echo "Downloading log4j."
wget --timestamping --no-verbose http://apache.osuosl.org/logging/log4j/2.9.0/apache-log4j-2.9.0-bin.tar.gz
echo "Downloading bouncycastle."
wget --timestamping --no-verbose https://www.bouncycastle.org/download/bcprov-jdk15on-158.jar
echo "Checking integrity."
sha256sum -c *.sha256
echo "Extracting."
cd ../lib
unzip ../downloaded/itext7-7.0.4.zip '*-7.0.4.jar'
tar xvfz ../downloaded/apache-log4j-2.9.0-bin.tar.gz --wildcards '*-2.9.0.jar'
mv apache-log4j-2.9.0-bin/*.jar . && rm -rf apache-log4j-2.9.0-bin
tar xvfz ../downloaded/slf4j-1.7.25.tar.gz --wildcards '*-1.7.25.jar'
mv slf4j-1.7.25/*.jar . && rm -rf slf4j-1.7.25
cp ../downloaded/bcprov-jdk15on-158.jar .
cd ..
echo "Done."