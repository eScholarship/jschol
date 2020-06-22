"jschol" - JSX eScholarship
===========================

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
* [Lando](https://lando.dev/) for bootstrapping a Docker-based development environment

Description of files
--------------------

* `.lando.yml`: the configuration file for Lando
* `Gemfile`: Lists of Ruby gems the app uses. Used by 'bundler' to download and install them locally.
* `Gemfile.lock`: Copy of Gemfile created and managed by 'bundler'. Don't modify directly.
* `README.md`: This file.
* `LICENSE`: Software license.
* `app/`: Directory that contains all the JSX, CSS, HTML, etc.
* `app/css`: Gets populated with compiled CSS files. Don't modify directly.
* `app/fonts`: Special fonts for this app.
* `app/images`: JPG, PNG, etc.
* `app/isomorphic.*`: A little node app that runs React on the server-side to generate the initial page contents.
* `app/js`: Gets populated with Babel-translated and possibily minified code. Don't modify directly.
* `app/jsx`: React code for the UI. These get compiled (through Gulp) into app/js.
* `app/scss`: CSS styles. Uses SCSS so macros, variables, etc. are available. These get compiled (through Gulp) into app/css/.
* `app/server.rb`: Main app driver with code to generate the page outline, supply database data, cache bust, etc.
* `bin/`: Gets populated by 'bundler' with driver scripts for gems it installs. Don't modify directly.
* `config`: A place to keep environment variables such as database and S3 connection parameters.
* `convert.rb`: Script to populate the new eschol5 database with units, item, etc. from the old eScholarship.
* `gems`: Gets populated by 'bundler' with driver scripts for gems it installs. Don't modify directly.
* `gulp`: Symbolic link to node_modules/.bin/gulp, so you can just run "./gulp" from the top-level directory.
* `gulpfile.js`: Controls the build process for CSS and Javascript, and runs the app on the server.
* `migrations`: Database schema in Ruby form. We can add new files here to morph the schema over time, and people can automatically upgrade their db.
* `node_modules`: Gets populated by 'node' with server-side Javascript packages. Don't modify directly.
* `package.json`: List of Javascript packages needed on the server. Includes mainly Gulp and React, and their dependencies.
* `setup.sh`: Sequence of commands to run bundler and node to download and install all the Ruby and Javascript modules the app needs.
* `tools/`: Conversion and database maintenance tools.
* `defaults.env`: default environment variable configuration for Lando
* `local.env.example`: example file for customizing your Lando dev workspace's environment variables, copy to `local.env` and customize as appropriate
* `.lando.local.yml.example`: example file for customizing your Lando dev workspace's Lando configuration, copy to `.lando.local.yml` and customize as appropriate

Steps to get the app running on your local machine, with Lando
1. Make sure [Lando](https://lando.dev/) is installed
 * Lando comes bundled with Docker Desktop, if you already have Docker Desktop installed, don't re-install it, just ensure you have the same version as what is bundled with Lando.
2. Copy `local.env.example` to `local.env` and customize as appropriate 
3. `lando poweroff` (defensively ensure no other Lando environments are running, probably not necessary, but a good habit)
4. `lando rebuild` 
5. When you see the big "Boomshakala" message from Lando, you're ready to go
6. Browse to `http://localhost:18880` (or whatever port you've configured for `PUMA_PORT` in your `local.env` file)

This Lando dev environment includes a local MySQL server, which can load MySQL dumps from dev, stg or prd. To load a dump file, run
1. `lando db-import name-of-mysql-dump-file.gz`

NOTE: if you do not have a dump file, ask Hardy, he can lend you a somewhat recent one. Or, you can rely on the SOCKS connection to use the db on one of our servers. Or you can use the VPN.

Troubleshooting
---------------
Use the `lando logs -f` command to see the logs from the appserver, or `lando logs -s db -f` to see the logs from the local database (if you're using it).

Run `lando` to see what other lando commands are available.

Tooling
-------
* `lando bundle` Runs bundle commands on the Lando Jschol appserver
* `lando npm` Runs npm commands on the Lando Jschol appserver
* `lando ruby`  Runs ruby commands on the Lando Jschol appserver
* `lando socks` Sets the socks proxy tunnel back up, if you have been too idle
* `lando ssh` Drops into a shell on a service, runs commands
* `lando start` Starts the Jschol app
* `lando stop` Stops the Jschol app

More [tooling](https://docs.lando.dev/config/tooling.html) can be added easily.


Steps to get the app running on your local machine without Lando
----------------------------------------------------------------
1. Make sure these are installed:
 * bundler
 * ruby
 * mysql
 * yarn

2. Install gems and packages: `./setup.sh` (Note: for neatness they get installed to the local directory, not system-wide)

3. Configure environment. Get somebody else's config/env.sh and modify to your needs.

4. `source config/env.sh`

5. Run `./gulp`. Be on the lookout for errors.

6. Browse to `http://localhost:4001/unit/root`, or `http://localhost:4001/item/08s7w2fd`, or `http://localhost:4001/search`

Migrating to a new database version
-----------------------------------

* `tools/migrate.rb`

Merging everything from master to prd branch
--------------------------------------------

* `git checkout master && git pull origin master && git checkout prd && git pull origin prd && git merge master && git push origin prd && git checkout master`
