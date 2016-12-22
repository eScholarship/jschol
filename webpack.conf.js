const webpack = require("webpack");
const _ = require('lodash');

///////////////////////////////////////////////////////////////////////////////////////////////////
// read package.json and get dependencies' package ids
function getNPMPackageIds() {
  var packageManifest = {};
  try {
    packageManifest = require('./package.json');
  } catch (e) {
    // does not have a package.json manifest
  }
  // Filter out modules that get bundled separately through require.ensure
  return _.filter(_.keys(packageManifest.dependencies) || [], 
                  dep => dep != 'pdfjs-embed' && dep != 'react-trumbowyg')
}

module.exports = {
  entry: {
    app: './app/jsx/App.jsx',
    lib: getNPMPackageIds()
  },
  output: {
    filename: '[name]-bundle.js',
    path: './app/js',
    publicPath: "/js/"
  },
  plugins: [
    // Chunk up our vendor libraries
    new webpack.optimize.CommonsChunkPlugin("lib"),
    // Provides jQuery globally to all browser modules, so we can use jquery plugins like Trumbowyg
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery"
    })
  ],
  module: {
    loaders: [{
      test: /\.jsx$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    },
    {
      test: /\.json$/,
      loader: 'json-loader'
    }]
  },
  performance : {
    hints : false
  },
  devtool: "cheap-module-source-map" // dev only
}