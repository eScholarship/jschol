"jschol" - JSX eScholarship
===========================

[![reviewdog](https://github.com/escholarship/jschol/workflows/reviewdog/badge.svg?branch=master&event=push)](https://github.com/escholarship/jschol/actions?query=workflow%3Areviewdog+event%3Apush+branch%3Amaster)

This app uses the following technology and features:
* React front-end framework including use of JSX for mixing HTML in Javascript
* React Router to implement single-page app
* Javascript ES2015 for advanced Javascript features (especially 'class')
* React component library to create the entire UI
* Sinatra lightweight server framework for Ruby
* Sequel object-relational mapper for Ruby
* CSS compilation using SASS
* Automatic rebuilds using Gulp
* LiveReload support so changes during development are reflected instantly in the browser
* Isometric Javascript to provide server-side initial rendering of pages (for fast first load, and for better crawlability)
* [Lando](https://lando.dev/) for bootstrapping a Docker-based development
  environment
* [AWS CLI](https://aws.amazon.com/cli/) for deploying to Elastic Beanstalk. See our [AWS CLI Cheatsheet](https://github.com/cdlib/pad-sys-doc/blob/main/cheatsheet/aws-cli.md).

Description of files
--------------------

* `Gemfile`: Lists of Ruby gems the app uses. Used by 'bundler' to download and install them locally.
* `Gemfile.lock`: Copy of Gemfile created and managed by 'bundler'. Don't modify directly.
* `README.md`: This file.
* `LICENSE`: Software license.
* `bin/`: Gets populated by 'bundler' with driver scripts for gems it installs. Don't modify directly.
* `config`: A place to keep environment variables such as database and S3 connection parameters.
* `gems`: Gets populated by 'bundler' with driver scripts for gems it installs. Don't modify directly.
* `migrations`: Database schema in Ruby form. We can add new files here to morph the schema over time, and people can automatically upgrade their db.
* `setup.sh`: Sequence of commands to run bundler to download and install all the Ruby modules the tools need.
* `tools/`: Conversion and database maintenance tools.
* `tools/convert.rb`: Script to populate the new eschol5 database with units, item, etc. from the old eScholarship.
* `defaults.env`: default environment variable configuration for Lando

Migrating to a new database version
-----------------------------------

* `tools/migrate.rb`

Merging everything from master to prd branch
--------------------------------------------

* `git checkout master && git pull origin master && git checkout prd && git pull origin prd && git merge master && git push origin prd && git checkout master`
