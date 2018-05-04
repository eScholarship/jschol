// ##### Gulp Toolkit for the jschol app #####

const _ = require('lodash');
const del = require('del');
const fs = require('fs');
const gulp = require('gulp');
const gutil = require('gulp-util');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const assets = require('postcss-assets');
const livereload = require('gulp-livereload')
const exec = require('child_process').exec
const spawn = require('child_process').spawn
const webpack = require('webpack');

// Process control for Sinatra and Express
var sinatraProc // Main app in Sinatra (Ruby)
var expressProc // Sub-app for isomophic javascript in Express (Node/Javascript)

var productionMode = !!gutil.env.production

// Build javscript bundles with Webpack
gulp.task('watch:src', (cb) => {
  const config = Object.create(require('./webpack.' + (productionMode ? 'prd' : 'dev') + '.js'));
  webpack(config, function(error, stats) {
    if (error) {
      gutil.log('[webpack]', error);
    }
    showSummary(stats);
    livereload.reload()
  });
});

function showSummary(stats) {
    gutil.log('[webpack]', stats.toString({
        colors: gutil.colors.supportsColor,
        hash: false,
        timings: false,
        chunks: false,
        chunkModules: false,
        modules: false,
        children: true,
        version: true,
        cached: false,
        cachedAssets: false,
        reasons: false,
        source: false,
        errorDetails: false
    }));
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
// Process Sass to CSS, add sourcemaps, autoprefix CSS selectors, optionally Base64 font and 
// image files into CSS, and reload browser:
gulp.task('sass', function() {
  return gulp.src('app/scss/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      flexbox: ['no-2009'],
      grid: false // don't prefix any properties from old grid spec since not all new grid properties correlate with old grid spec still used by IE
    }))
    .pipe(postcss([assets({
      loadPaths: ['fonts/', 'images/']
    })]))
    .pipe(sourcemaps.write('sourcemaps'))
    .pipe(gulp.dest('app/css'))
    .pipe(livereload())
})

///////////////////////////////////////////////////////////////////////////////////////////////////
// Support functions for starting and restarting Sinatra (server for the main Ruby app)
function startSinatra(afterFunc)
{
  // Sometimes Puma doesn't die even when old gulp does. Explicitly kill it off.
  exec('pkill -9 -f ^puma.*'+process.env.PUMA_PORT, (err, stdout, stderr) => { })
  setTimeout(()=>{
    // Now spawn a new sinatra/puma process
    sinatraProc = spawn('bin/puma', { stdio: 'inherit' })
    sinatraProc.on('exit', function(code) {
      sinatraProc = null
    })
  }, 500)
}

function restartSinatra()
{
  if (sinatraProc) {
    console.log("Restarting Sinatra.")
    sinatraProc.kill('SIGUSR1')
  }
  else {
    startSinatra()
  }
}

gulp.task('restart-sinatra', restartSinatra)

gulp.task('start-sinatra', restartSinatra)

///////////////////////////////////////////////////////////////////////////////////////////////////
// Support functions for starting and restarting Express, which runs the isomorphic-js sub-app.
function startExpress()
{
  if (process.env.ISO_PORT) {
    exec('pkill -9 -f ^node.*iso.*'+process.env.ISO_PORT, (err, stdout, stderr) => { })
    setTimeout(()=>{
      expressProc = spawn('node', ['app/isomorphic.js'], { stdio: 'inherit' })
      expressProc.on('exit', function(code) {
        expressProc = null
      })
    }, 500)
  }
}

function restartExpress() {
  if (expressProc) {
    console.log("Restarting Express.")
    expressProc.on('exit', function(code) {
      startExpress()
    })
    expressProc.kill()
    expressProc = null
  }
  else {
    startExpress()
  }
}

gulp.task('restart-express', restartExpress)

gulp.task('start-express', restartExpress)

gulp.task('rsync', function() {
  exec('rsync -a --exclude js --exclude css --exclude bower_components /outer_jschol/app/ /home/jschol/inner_jschol/app/',
    (err, stdout, stderr) => {
      console.log(stderr)
    }
  )
});

///////////////////////////////////////////////////////////////////////////////////////////////////
// Watch sass, html, and js and reload browser if any changes
gulp.task('watch', function() {
  gulp.watch('app/scss/*.scss', {interval:500}, ['sass']);
  gulp.watch(['app/*.rb', 'util/*.rb'], {interval:500}, ['restart-sinatra']);
  gulp.watch(['app/isomorphic.jsx'], {interval:800}, ['restart-express']);

  if (fs.existsSync('/outer_jschol/app/jsx/App.jsx'))
    gulp.watch(['/outer_jschol/app/scss/*.scss',
                '/outer_jschol/app/jsx/**/*.jsx',
                '/outer_jschol/app/*.rb', '/outer_jschol/util/*.rb'],
               {interval:2000}, ['rsync']);
});

///////////////////////////////////////////////////////////////////////////////////////////////////
gulp.task('livereload', function() {
  livereload.listen();
});

gulp.task('maybe-socks', function() {
  var socksProc = spawn('ruby', ['tools/maybeSocks.rb'], { stdio: 'inherit' })
});

///////////////////////////////////////////////////////////////////////////////////////////////////
// Build everything in order, then start the servers and watch for incremental changes.
if (productionMode) {
  gulp.task('default',  ['watch:src', 'watch', 'start-sinatra', 'sass'])
} else {
  gulp.task('default', ['watch:src', 'watch', 'start-sinatra', 'start-express', 
                        'maybe-socks', 'livereload', 'sass'])
}
