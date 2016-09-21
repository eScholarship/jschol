// ##### Gulp Toolkit for the eScholarship app #####

const _ = require('lodash');
const del = require('del');
const gulp = require('gulp');
const gutil = require('gulp-util');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const scsslint = require('gulp-scss-lint');
const postcss = require('gulp-postcss');
const assets = require('postcss-assets');
const source = require('vinyl-source-stream');
const browserify = require('browserify');
const watchify = require('watchify');
const babelify = require('babelify');
const livereload = require('gulp-livereload')
const spawn = require('child_process').spawn
 
// Processes we will start up
var startingUp = true
var libsBuilt = false
var appBuilt = false
var sinatraProc // Main app in Sinatra (Ruby)
var expressProc // Sub-app for isomophic javascript in Express (Node/Javascript)

///////////////////////////////////////////////////////////////////////////////////////////////////
// Transformations to build lib-bundle.js
gulp.task('bundle-libs', function() {
  var b = watchify(browserify({
    entries: ['package.json'],
    debug: true,  // generate source maps
    cache: {}, packageCache: {}, fullPaths: true
  }))

  function bundle() {
    gutil.log("Bundling libs.")
    libsBuilt = false
    del("app/js/lib-bundle.js")
    // This bundle will encompass everything in package.json that's not a "dev" dependency
    getNPMPackageIds().forEach(function (id) { b.require(id) });
    return b.bundle()
      .on('error', gutil.log.bind(gutil, 'Bundling error'))
      .pipe(source('app/js/lib-bundle.js'))
      .pipe(gulp.dest('.'))
      .on('end', function() { libsBuilt = true; checkAllBundlesReady() })
  }

  bundle()
  return b.on('update', bundle).on('log', gutil.log)
});

///////////////////////////////////////////////////////////////////////////////////////////////////
// Transformations to build app-bundle.js
gulp.task('bundle-app', function() {
  var b = watchify(browserify({
    entries: ['app/jsx/App.jsx'],
    debug: true,  // generate source maps
    cache: {}, packageCache: {}, fullPaths: true
  }))

  function bundle() {
    gutil.log("Bundling app.")
    appBuilt = false
    del("app/js/app-bundle.js")
    // This bundle is for the app, and excludes all package.json dependencies
    getNPMPackageIds().forEach(function (id) { b.external(id) });
    return b
      .transform('babelify')  // note: presets are taken from .babelrc file
      .bundle()
      .on('error', gutil.log.bind(gutil, 'Bundling error'))
      .pipe(source('app/js/app-bundle.js'))
      .pipe(gulp.dest('.'))
      .on('end', function() { appBuilt = true; checkAllBundlesReady() })
  }

  bundle()
  return b.on('update', bundle).on('log', gutil.log)
});

function checkAllBundlesReady() {
  if (!appBuilt || !libsBuilt)
    return

  if (startingUp) {
    console.log("All bundles ready. Starting servers.")
    startExpressAndSinatra()
  }
  else {
    console.log("not starting up, so doing livereload")
    livereload.reload()
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
// read package.json and get dependencies' package ids
function getNPMPackageIds() {
  var packageManifest = {};
  try {
    packageManifest = require('./package.json');
  } catch (e) {
    // does not have a package.json manifest
  }
  return _.keys(packageManifest.dependencies) || [];
}

///////////////////////////////////////////////////////////////////////////////////////////////////
// Process Sass to CSS, add sourcemaps, autoprefix CSS selectors, optionally Base64 font and image files into CSS, and reload browser:
gulp.task('sass', function() {
  gulp.src('app/scss/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(autoprefixer('last 2 versions'))
    .pipe(postcss([assets({ loadPaths: ['fonts/', 'images/'] })]))
    .pipe(sourcemaps.write('sourcemaps'))
    .pipe(gulp.dest('app/css'))
    .pipe(livereload())
})

///////////////////////////////////////////////////////////////////////////////////////////////////
function startSinatra(afterFunc)
{
  // The '-o 0.0.0.0' below is required for Sinatra to bind to ipv4 localhost, instead of ipv6 localhost
  sinatraProc = spawn('ruby', ['app/server.rb', '-p', '4001', '-o', '0.0.0.0'], { stdio: 'inherit' })
  sinatraProc.on('exit', function(code) {
    sinatraProc = null
  })
  if (afterFunc)
    spawn('ruby', ['tools/waitForServer.rb', 'http://localhost:4001/check', '20']).on('exit', afterFunc)
}

function restartSinatra(afterFunc)
{
  if (sinatraProc) {
    console.log("Restarting Sinatra.")
    sinatraProc.on('exit', function(code) {
      startSinatra(afterFunc)
    })
    sinatraProc.kill()
    sinatraProc = null
  }
  else {
    console.log("Starting Sinatra.")
    startSinatra(afterFunc)
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
gulp.task('restart-sinatra', function() {
  restartSinatra(function() {
    livereload.reload()
  })
});

///////////////////////////////////////////////////////////////////////////////////////////////////
function startExpress(afterFunc)
{
  expressProc = spawn('node', ['app/isomorphic.js'], { stdio: 'inherit' })
  expressProc.on('exit', function(code) {
    expressProc = null
  })
  if (afterFunc)
    spawn('ruby', ['tools/waitForServer.rb', 'http://localhost:4002/check', '20']).on('exit', afterFunc)
}

///////////////////////////////////////////////////////////////////////////////////////////////////
function restartExpress(afterFunc) {
  if (expressProc) {
    console.log("Restarting Express.")
    expressProc.on('exit', function(code) {
      startExpress(afterFunc)
    })
    expressProc.kill()
    expressProc = null
  }
  else {
    console.log("Starting Express.")
    startExpress(afterFunc)
  }
}

///////////////////////////////////////////////////////////////////////////////////////////////////
gulp.task('restart-express', function() {
  restartExpress(function() {
    console.log("express started - doing livereload")
    livereload.reload()
  })
})

///////////////////////////////////////////////////////////////////////////////////////////////////
function startExpressAndSinatra()
{
  startingUp = false
  livereload.listen();
  console.log("Starting Express.")
  startExpress(function() {
    console.log("Starting Sinatra.")
    startSinatra(function() {
      console.log("Express and sinatra started: Ready to serve.")
      livereload.reload()
    })
  })
}

///////////////////////////////////////////////////////////////////////////////////////////////////
// Watch sass, html, and js and reload browser if any changes:
gulp.task('watch', function() {
  gulp.watch('app/scss/**/*.scss', ['sass', 'scss-lint']);
  gulp.watch('app/**/*.html', livereload.reload);
  gulp.watch('app/*.rb', ['restart-sinatra']);
  gulp.watch(['app/isomorphic.js*'], ['restart-express']);
});

///////////////////////////////////////////////////////////////////////////////////////////////////
// Lint Sass
gulp.task('scss-lint', function() {
  return gulp.src(['app/scss/**/*.scss', '!app/scss/vendor/**/*.scss'])
    .pipe(scsslint({
      'config': 'scss-lint-config.yml' // Settings for linters. See: https://github.com/brigade/scss-lint/tree/master/lib/scss_lint/linter
    }));
});

///////////////////////////////////////////////////////////////////////////////////////////////////
// Run the dev process 'gulp':
gulp.task('default',  ['bundle-libs', 'bundle-app', 'sass', 'watch'])
