
import express                   from 'express'
import url                       from 'url'
import http                      from 'http'
import React                     from 'react'
import ReactDOMServer            from 'react-dom/server'
import { StaticRouter }          from 'react-router-dom'
import decache                   from 'decache'
import fs                        from 'fs'
import MetaTagsServer            from 'react-meta-tags/server'
import {MetaTagsContext}         from 'react-meta-tags'
import bodyParser                from 'body-parser'
import { GracefulShutdownManager } from '@moebius/http-graceful-shutdown'

var lastStamp
var AppRoot = null

const app = express()

app.use(bodyParser.json({limit: '10mb'}));

function cacheBundle()
{
  // Cache the app code. We can base the cache on the app bundle.
  if (fs.existsSync("app/js/manifest.json")) {
    var curStamp = new Date(fs.statSync("app/js/manifest.json").mtime)
    if ((lastStamp - curStamp) != 0) {
      console.log("ISO: Loading new app bundle.    ")
      lastStamp = curStamp
      if (AppRoot)
        decache('./jsx/App.jsx')
      AppRoot = require('./jsx/App.jsx')
      console.log("ISO: Bundle loaded.             ")
    }
  }
}

// Simple check for up-ness
app.get('/check', (req, res) =>
{
  cacheBundle()
  res.send("ok")
})

// Main entry point
app.post('*', (req, res) =>
{
  cacheBundle()

  // Perform an initial routing and render to grab the API URL that gets fetched.
  var refURL = req.protocol + '://' + req.get('host') + req.originalUrl
  //console.log("ISO fetch:", refURL)

  try {

    // Note: because this is being turned into code, we have to jump through hoops to properly
    //       escape special characters.
    //let json = body.replace(/[\u007F-\uFFFF]/g, chr => "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).substr(-4))
    //json = json.replace(/\\/g, "\\\\") // for some reason need to double-escape backslashes, e.g. qt3f3256kv abstract
    /* Note: must leave comments like <!-- react-text: 14 --> so that react will
       properly match up the rendered HTML to client-generated HTML */

    // And integrate the API data into the app to produce the final output
    let metaTagsInstance = MetaTagsServer()
    let renderedHTML = ReactDOMServer.renderToString(
      <StaticRouter location={req.url} context={{ pageData: req.body }}>
        <MetaTagsContext extract={metaTagsInstance.extract}>
          <AppRoot />
        </MetaTagsContext>
      </StaticRouter>
    )
    res.send(
      "<metaTags>" + metaTagsInstance.renderToString() + "</metaTags>\n" +
      "<div id=\"main\">" + renderedHTML + "</div>")
  }
  catch (e) {
    console.log("Exception generating React HTML:", e)
    console.log(e.stack)
    res.status(500).send(e)
  }
})

const PORT = process.env.ISO_PORT

const server = app.listen(PORT, function () {
  console.log('ISO: Worker listening on port ' + PORT + ".")
})

const shutdownManager = new GracefulShutdownManager(server)

// Fire off an initial request to get the app bundle loading.
http.get("http://localhost:4002/check", function(ajaxResp) {
  ajaxResp.on('end', function() { console.log("Initial check: code=", ajaxResp.statusCode) })
})

process.on('SIGTERM', () => {
  shutdownManager.terminate(() => {
    console.log('ISO: worker terminated.')
  })
})