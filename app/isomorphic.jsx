
import express                   from 'express'
import url                       from 'url'
import http                      from 'http'
import React                     from 'react'
import ReactDOMServer            from 'react-dom/server'
import { StaticRouter }          from 'react-router-dom'
import decache                   from 'decache'
import fs                        from 'fs'
import MetaTagsServer            from 'react-meta-tags/server';
import {MetaTagsContext}         from 'react-meta-tags';

var lastStamp
var AppRoot = null

const app = express()

app.use((req, res) =>
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

  // Simple check for up-ness
  if (req.originalUrl == "/check") {
    res.send("ok")
    return
  }

  // Perform an initial routing and render to grab the API URL that gets fetched.
  var refURL = req.protocol + '://' + req.get('host') + req.originalUrl
  console.log("ISO fetch:", refURL)

  let urls = []
  let metaTagsInstance = MetaTagsServer()
  let renderedHTML = ReactDOMServer.renderToString(
    <StaticRouter location={req.url} context={{ urlsToFetch: urls }}>
      <MetaTagsContext extract={metaTagsInstance.extract}>
        <AppRoot />
      </MetaTagsContext>
    </StaticRouter>
  )
  if (urls.length == 0)
    res.send(`<metaTags>${metaTagsInstance.renderToString()}</metaTags>\n<div id=\"main\">${renderedHTML}</div>`)
  else if (urls.length == 1)
  {
    // Go get the API data
    var partialURL = urls[0]
    var finalURL = url.resolve(refURL, partialURL).replace(":"+process.env.ISO_PORT, ":"+process.env.PUMA_PORT)
    console.log("...integrating data from:", finalURL)

    http.get(finalURL, function(ajaxResp) {
      var body = ''
      ajaxResp.on('data', function(chunk) {
        body += chunk
      })
      ajaxResp.on('end', function()
      {
        if (ajaxResp.statusCode != "200") {
          res.status(ajaxResp.statusCode).send(body)
          return
        }
        try {
          var response
          try {
            response = JSON.parse(body)
          }
          catch (e) {
            console.log("ISO Exception parsing JSON:", e)
            response = { error: body }
            body = JSON.stringify(response)
          }

          // Transform API error format to pageData error format
          if (response.error === true && response.message) {
            console.log("Got error response:", response.message)
            response = { error: "Error: " + response.message }
            body = JSON.stringify(response)
          }

          // Note: because this is being turned into code, we have to jump through hoops to properly
          //       escape special characters.
          let json = body.replace(/[\u007F-\uFFFF]/g, chr => "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).substr(-4))
          json = json.replace(/\\/g, "\\\\") // for some reason need to double-escape backslashes, e.g. qt3f3256kv abstract
          /* Note: must leave comments like <!-- react-text: 14 --> so that react will
             properly match up the rendered HTML to client-generated HTML */

          // And integrate the API data into the app to produce the final output
          let urlsFetched = {}
          urlsFetched[partialURL] = response
          metaTagsInstance = MetaTagsServer()
          renderedHTML = ReactDOMServer.renderToString(
            <StaticRouter location={req.url} context={{ urlsFetched: urlsFetched }}>
              <MetaTagsContext extract={metaTagsInstance.extract}>
                <AppRoot />
              </MetaTagsContext>
            </StaticRouter>
          )
          res.status(ajaxResp.statusCode).send(
            "<metaTags>" + metaTagsInstance.renderToString() + "</metaTags>\n" +
            "<script>window.jscholApp_initialPageData = " + json + ";</script>\n" +
            "<div id=\"main\">" + renderedHTML + "</div>")
        }
        catch (e) {
          console.log("Exception generating React HTML:", e)
          console.log(e.stack)
          res.status(500).send(e)
        }
      })
    }).on('error', function(e) {
      console.log("Got HTTP error " + e)
      res.status(500).send("Got HTTP error " + e)
    })
  }
  else
    throw "Internal error: currently support only one url in urlsToFetch"
})

const PORT = process.env.ISO_PORT

app.listen(PORT, function () {
  console.log('ISO worker listening on port', PORT)
})

// Fire off an initial request to get the app bundle loading.
http.get("http://localhost:4002/check", function(ajaxResp) {
  ajaxResp.on('end', function() { console.log("Initial check: code=", ajaxResp.statusCode) })
})
