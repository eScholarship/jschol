// ##### Gulp Toolkit for the eScholarship app #####

const _ = require('lodash');
const del = require('del');
const gulp = require('gulp');
const gutil = require('gulp-util');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const runSequence = require('run-sequence');
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
var sinatraProc // Main app in Sinatra (Ruby)
var expressProc // Sub-app for isomophic javascript in Express (Node/Javascript)

///////////////////////////////////////////////////////////////////////////////////////////////////
// Transformations to build lib-bundle.js
gulp.task('bundle-libs', function() {
  var b = watchify(browserify({
    entries: ['package.json'],
    debug: false,
    cache: {}, packageCache: {}, fullPaths: true
  }))

  function bundle() {
    gutil.log("Bundling libs.")
    del("app/js/lib-bundle.js")
    // This bundle will encompass everything in package.json that's not a "dev" dependency
    getNPMPackageIds().forEach(function (id) { b.require(id) });
    return b.bundle()
      .on('error', gutil.log.bind(gutil, 'Bundling error'))
      .pipe(source('app/js/lib-bundle.js'))
      .pipe(gulp.dest('.'))
  }

  bundle()
  return b.on('update', bundle).on('log', gutil.log)
});

///////////////////////////////////////////////////////////////////////////////////////////////////
// Transformations to build app-bundle.js
gulp.task('bundle-app', function() {
  var b = watchify(browserify({
    entries: ['app/jsx/app.jsx'],
    debug: false,
    cache: {}, packageCache: {}, fullPaths: true
  }))

  function bundle() {
    gutil.log("Bundling app.")
    del("app/js/app-bundle.js")
    // This bundle is for the app, and excludes all package.json dependencies
    getNPMPackageIds().forEach(function (id) { b.external(id) });
    return b
      .transform('babelify', {presets: ['es2015', 'react', 'stage-2']})
      .bundle()
      .on('error', gutil.log.bind(gutil, 'Bundling error'))
      .pipe(source('app/js/app-bundle.js'))
      .pipe(gulp.dest('.'))
  }

  bundle()
  return b.on('update', bundle).on('log', gutil.log)
});

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
// Run the dev process 'gulp':
gulp.task('default', function (callback) {
  runSequence(['bundle-libs', 'bundle-app', 'watch', 'sinatra'],  // FIXME: add 'express' when we do iso
    callback
  )
})

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
gulp.task('restart-sinatra', function() {
  console.log("Restarting Sinatra.")
  if (sinatraProc) {
    sinatraProc.on('exit', function(code) {
      sinatraProc = spawn('ruby', ['app/escholApp.rb', '-p', '4001'], { stdio: 'inherit' })
    })
    sinatraProc.kill()
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////
// Watch sass, html, and js and reload browser if any changes:
gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('app/scss/**/*.scss', ['sass']);
  gulp.watch('app/scss/**/*.scss', ['scss-lint']);
  gulp.watch('app/**/*.html', livereload.reload);
  gulp.watch('app/js/**/*.js', livereload.reload);
  gulp.watch('app/*.rb', ['restart-sinatra']);
});

///////////////////////////////////////////////////////////////////////////////////////////////////
// Fire up the api server in Sinatra (Ruby).
gulp.task('sinatra', function() {
  sinatraProc = spawn('ruby', ['app/escholApp.rb', '-p', '4001'], { stdio: 'inherit' })
})

///////////////////////////////////////////////////////////////////////////////////////////////////
// Fire up the isomorphic sub-app in Node/Express (Javascript)
gulp.task('express', function() {
  expressProc = spawn('node', ['app/escholIso.js'], { stdio: 'inherit' })
})

///////////////////////////////////////////////////////////////////////////////////////////////////
// Lint Sass
gulp.task('scss-lint', function() {
  return gulp.src(['app/scss/**/*.scss', '!app/scss/vendor/**/*.scss'])
    .pipe(scsslint({
      'config': 'scss-lint-config.yml' // Settings for linters. See: https://github.com/brigade/scss-lint/tree/master/lib/scss_lint/linter
    }));
});
