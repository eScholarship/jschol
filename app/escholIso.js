"use strict"

var express = require('express')
var fs = require('fs')
var app = express()
var bodyParser = require('body-parser')
var React = require('react')
var ReactDOMServer = require('react-dom/server')

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

var pageCache = {}
function cachePageCode(path) {
  var mtime = fs.statSync(path).mtime
  var cached = pageCache[path]
  if (cached && cached.mtime.getTime() == mtime.getTime()) {
    console.log("Found cached entry for path=" + path + ", mtime=" + mtime)
    return cached.code
  }

  console.log("New cache entry for path=" + path + ", mtime=" + mtime)
  console.log(
    "(function (React, initialData) {\n" +
       "var ReactDOM = { 'render': function(reactEl, domEl) { reactRootEl = reactEl } }\n" +
       "var document = { 'getElementById': function() { } }\n" +
       "var reactRootEl\n" +
       fs.readFileSync('public/js/global.js') + "\n" +
       fs.readFileSync(path) + "\n" +
       "return reactRootEl\n" +
    "})")
  var pageCode = eval(
    "(function (React, initialData) {\n" +
       "var ReactDOM = { 'render': function(reactEl, domEl) { reactRootEl = reactEl } }\n" +
       "var document = { 'getElementById': function() { } }\n" +
       "var reactRootEl\n" +
       fs.readFileSync('public/js/global.js') + "\n" +
       fs.readFileSync(path) + "\n" +
       "return reactRootEl\n" +
    "})")
  pageCache[path] = { mtime: mtime, code: pageCode }
  return pageCode
}

app.post(/^\/\w+$/, function (req, res) {
  var page = req.path.substring(1) // strip off initial '/'
  var pageCode = cachePageCode('public/js/'+page+'.js')
  var initialData = req.body
  var reactRoot = pageCode(React, initialData)
  res.send(ReactDOMServer.renderToString(reactRoot))
})

app.listen(4002, function () {
  console.log('iso app listening on port 4002')
})