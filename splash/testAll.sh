set -e

javac -classpath lib/itext7-io-7.0.4.jar:lib/itext7-kernel-7.0.4.jar:lib/itext7-forms-7.0.4.jar SplashGen.java
cd test/in
files=(`ls qt*.pdf`)
cd ../..
for file in "${files[@]}"; do
  java -classpath .:lib/itext7-io-7.0.4.jar:lib/itext7-kernel-7.0.4.jar:lib/itext7-forms-7.0.4.jar:lib/log4j-over-slf4j-1.7.25.jar:lib/slf4j-api-1.7.25.jar:lib/log4j-slf4j-impl-2.9.0.jar:lib/log4j-api-2.9.0.jar:lib/log4j-core-2.9.0.jar:lib/bcprov-jdk15on-158.jar SplashGen test/cover/splash17.pdf test/in/$file test/out/$file
done