// ##### Gulp Toolkit for the jschol app #####

const _ = require('lodash')
const del = require('del')
const fs = require('fs')
const gulp = require('gulp')
const gutil = require('gulp-util')
const sass = require('gulp-sass')
const autoprefixer = require('gulp-autoprefixer')
const sourcemaps = require('gulp-sourcemaps')
const postcss = require('gulp-postcss')
const assets = require('postcss-assets')
const livereload = require('gulp-livereload')
const exec = require('child_process').exec
const spawn = require('child_process').spawn
const webpack = require('webpack')
const merge = require('webpack-merge')

// Process control for Sinatra
var sinatraProc // Main app in Sinatra (Ruby)

var productionMode = !!gutil.env.production

// Build javscript bundles with Webpack
gulp.task('watch:src', (done) => {
  const config = merge(require('./webpack.' + (productionMode ? 'prd' : 'dev') + '.js'), {
    watch: true,
  })
  webpack(config, function(error, stats) {
    if (error) {
      gutil.log('[webpack]', error);
    }
    showSummary(stats);
    livereload.reload()
  });
  done()
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

function restartSinatra(done)
{
  if (sinatraProc) {
    console.log("Restarting Sinatra.")
    sinatraProc.kill('SIGUSR1')
  }
  else {
    startSinatra()
  }
  console.log("restart sinatra complete.")
  done()
}

gulp.task('start-sinatra', restartSinatra)

///////////////////////////////////////////////////////////////////////////////////////////////////
// Watch sass, html, and js and reload browser if any changes
gulp.task('watch', function() {
  gulp.watch('app/scss/*.scss', {interval:500}, gulp.parallel(['sass']));
  gulp.watch(['app/*.rb', 'util/*.rb'], {interval:500}, restartSinatra)
});

///////////////////////////////////////////////////////////////////////////////////////////////////
gulp.task('livereload', function(done) {
  livereload.listen();
  done()
});

gulp.task('maybe-socks', function(done) {
  var socksProc = spawn('ruby', ['tools/maybeSocks.rb'], { stdio: 'inherit' })
  done()
});

///////////////////////////////////////////////////////////////////////////////////////////////////
// Build everything in order, then start the servers and watch for incremental changes.
if (productionMode) {
  gulp.task('default',  gulp.parallel(['watch:src', 'watch', 'start-sinatra', 'sass']))
} else {
  gulp.task('default', gulp.parallel(['watch:src', 'watch', 'start-sinatra',
                        'maybe-socks', 'livereload', 'sass']))
}
