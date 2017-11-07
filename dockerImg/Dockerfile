# Docker image for running escholarship's "jschol" app
FROM amazonlinux:2017.09
RUN yum -y install wget && wget https://rpm.nodesource.com/pub_7.x/el/7/x86_64/nodesource-release-el7-1.noarch.rpm && yum -y install nodesource-release-el7-1.noarch.rpm && rm nodesource-release-el7-1.noarch.rpm
RUN yum -y install ruby23-devel gcc gcc-c++ mysql-devel patch sqlite-devel git nodejs
RUN npm install --global yarn && gem install bundler
RUN adduser jschol
USER jschol
RUN cd /home/jschol && git clone https://github.com/eScholarship/jschol.git inner_jschol && cd inner_jschol && ./setup.sh
