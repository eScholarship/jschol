set -e

rm -rf WEB-INF/lib WEB-INF/bin
mkdir -p downloaded WEB-INF/lib WEB-INF/bin
cd downloaded
echo "Downloading."
wget --no-clobber --no-verbose https://github.com/itext/itext7/releases/download/7.1.4/iText7-Core-7.1.4.zip
wget --no-clobber --no-verbose https://www.slf4j.org/dist/slf4j-1.7.25.tar.gz
wget --no-clobber --no-verbose http://apache.osuosl.org/logging/log4j/2.9.0/apache-log4j-2.9.0-bin.tar.gz
wget --no-clobber --no-verbose https://www.bouncycastle.org/download/bcprov-jdk15on-158.jar
wget --no-clobber --no-verbose http://repo1.maven.org/maven2/org/codeartisans/org.json/20161124/org.json-20161124.jar
wget --no-clobber --no-verbose http://mirrors.sonic.net/apache/ant/binaries/apache-ant-1.10.1-bin.zip
echo "Checking integrity."
sha256sum -c *.sha256
echo "Extracting."
cd ../WEB-INF/lib
unzip -q ../../downloaded/iText7-Core-7.1.4.zip '*.jar'
rm *-javadoc.jar *-sources.jar
tar xfz ../../downloaded/apache-log4j-2.9.0-bin.tar.gz --wildcards '*-2.9.0.jar'
mv apache-log4j-2.9.0-bin/*.jar . && rm -rf apache-log4j-2.9.0-bin
rm log4j-slf4j-impl-2.9.0.jar
tar xfz ../../downloaded/slf4j-1.7.25.tar.gz --wildcards '*-1.7.25.jar'
mv slf4j-1.7.25/*api*.jar . && mv slf4j-1.7.25/*simple*.jar . && rm -rf slf4j-1.7.25
cp ../../downloaded/bcprov-jdk15on-158.jar .
cp ../../downloaded/org.json-20161124.jar .
cd ../bin
unzip -q ../../downloaded/apache-ant-1.10.1-bin.zip
ln -s apache-ant-1.10.1/bin/ant .
cd ..
echo "Building."
export ANT_HOME=$PWD/bin/apache-ant-1.10.1
bin/ant
echo "Done."
