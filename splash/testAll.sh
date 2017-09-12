set -e

classpath=lib/itext7-io-7.0.4.jar:lib/itext7-kernel-7.0.4.jar:lib/itext7-forms-7.0.4.jar:lib/itext7-layout-7.0.4.jar:lib/log4j-over-slf4j-1.7.25.jar:lib/slf4j-api-1.7.25.jar:lib/log4j-slf4j-impl-2.9.0.jar:lib/log4j-api-2.9.0.jar:lib/log4j-core-2.9.0.jar:lib/bcprov-jdk15on-158.jar:/usr/share/tomcat8/lib/tomcat8-servlet-3.1-api.jar
javac -classpath $classpath SplashGen.java
cd test/in
files=(`ls qt00*.pdf`)
cd ../..
for file in "${files[@]}"; do
  java -classpath .:$classpath SplashGen test/cover/splash13.pdf test/in/$file test/out/$file
done