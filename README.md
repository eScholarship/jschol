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

Description of files
--------------------

* `Gemfile`: Lists of Ruby gems the app uses. Used by 'bundler' to download and install them locally.
* `Gemfile.lock`: Copy of Gemfile created and managed by 'bundler'. Don't modify directly.
* `README.md`: This file.
* `LICENSE`: Software license.
* `app/`: Directory that contains all the JSX, CSS, HTML, etc.
* `app/bower_components`: Gets populated by 'bower' with the Javascript packages for the front-end. Don't modify directly.
* `app/css`: Gets populated with compiled CSS files. Don't modify directly.
* `app/fonts`: Special fonts for this app.
* `app/images`: JPG, PNG, etc.
* `app/isomorphic.*`: A little node app that runs React on the server-side to generate the initial page contents.
* `app/js`: Gets populated with Babel-translated and possibily minified code. Don't modify directly.
* `app/jsx`: React code for the UI. These get compiled (through Gulp) into app/js.
* `app/scss`: CSS styles. Uses SCSS so macros, variables, etc. are available. These get compiled (through Gulp) into app/css/.
* `app/server.rb`: Main app driver with code to generate the page outline, supply database data, cache bust, etc.
* `bin/`: Gets populated by 'bundler' with driver scripts for gems it installs. Don't modify directly.
* `bower.json`: List of Javascript packages used in the front-end. Used by 'node' to download and install them locally.
* `config`: A place to keep database connection parameters. Will probably be replaced by an environment variable setup.
* `convert.rb`: Script to populate the new eschol5 database with units, item, etc. from the old eScholarship.
* `gems`: Gets populated by 'bundler' with driver scripts for gems it installs. Don't modify directly.
* `gulp`: Symbolic link to node_modules/.bin/gulp, so you can just run "./gulp" from the top-level directory.
* `gulpfile.js`: Controls the build process for CSS and Javascript, and runs the app on the server.
* `migrations`: Database schema in Ruby form. We can add new files here to morph the schema over time, and people can automatically upgrade their db.
* `node_modules`: Gets populated by 'node' with server-side Javascript packages. Don't modify directly.
* `package.json`: List of Javascript packages needed on the server. Includes mainly Gulp and React, and their dependencies.
* `scss-lint-config.yml`: Configures which kinds of problems to look for in our SCSS files.
* `setup.sh`: Sequence of commands to run bundler and node to download and install all the Ruby and Javascript modules the app needs.
* `tools/`: Conversion and database maintenance tools.

Steps to get the app running
----------------------------

1. Install gems and packages: `./setup.sh` (Note: for neatness they get installed to the local directory, not system-wide)

2. Start proxy connection to database through bastion: `ssh -C -N -L3306:rds-pub-eschol-dev.cmcguhglinoa.us-west-2.rds.amazonaws.com:3306 -p 18822 cdl-aws-bastion.cdlib.org`

3. Configure database connection parameters: `cp config/database.yaml.TEMPLATE config/database.yaml`, then fill in the values in `database.yaml`:
  * host: 127.0.0.1
  * port: 3306
  * database: eschol_test
  * username: SECRET
  * password: SECRET

4. Run `./gulp`. Be on the lookout for errors.

5. Browse to `http://localhost:4001/unit/root`, or `http://localhost:4001/item/08s7w2fd`, or `http://localhost:4001/search`

