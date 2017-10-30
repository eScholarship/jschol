
import express                   from 'express'
import cluster                   from 'express-cluster'
import url                       from 'url'
import http                      from 'http'
import React                     from 'react'
import { renderToString }        from 'react-dom/server'
import { Router, RouterContext, match }  from 'react-router'
import decache                   from 'decache'
import fs                        from 'fs'
import readYaml                  from 'read-yaml'
import MetaTagsServer            from 'react-meta-tags/server';
import {MetaTagsContext}         from 'react-meta-tags';

let serverConfig = readYaml.sync('config/server.yaml')

var lastStamp
var routes = null

//cluster(worker => {
  const app = express()

  app.use((req, res) =>
  {
    // Cache the app code. We can base the cache on the app bundle.
    var curStamp = new Date(fs.statSync("app/js/manifest.json").mtime)
    if ((lastStamp - curStamp) != 0) {
      console.log("ISO: Loading new app bundle.    ")
      lastStamp = curStamp
      if (routes)
        decache('./jsx/App.jsx')
      routes = require('./jsx/App.jsx')
      console.log("ISO: Bundle loaded.             ")
    }

    // Simple check for up-ness
    if (req.originalUrl == "/check") {
      res.send("ok")
      return
    }

    // Now route the request
    var refURL = req.protocol + '://' + req.get('host') + req.originalUrl
    console.log("ISO fetch:", refURL)
    match({ routes: routes, location: req.url }, (err, redirectLocation, renderProps) => {
      if (err) {
        console.error(err)
        return res.status(500).end('Internal server error')
      }
      if (!renderProps) return res.status(404).end('Not found.')
      var rc = <RouterContext {...renderProps}/>
      rc.props.location.host = req.get('host')
      var urls = []
      rc.props.location.urlsToFetch = urls
      let metaTagsInstance = MetaTagsServer()
      let renderedHTML = renderToString(<MetaTagsContext extract = {metaTagsInstance.extract}>{rc}</MetaTagsContext>)
      let meta = metaTagsInstance.renderToString()
      if (urls.length == 0)
        res.send(`<metaTags>${meta}</metaTags>\n<div id=\"main\">${renderedHTML}</div>`)
      else if (urls.length == 1)
      {
        var partialURL = urls[0]
        var finalURL = url.resolve(refURL, partialURL).replace(":"+serverConfig.isoPort, ":"+serverConfig.mainPort)
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

              delete rc.props.location.urlsToFetch
              rc.props.location.urlsFetched = {}
              rc.props.location.urlsFetched[partialURL] = response

              metaTagsInstance = MetaTagsServer()
              renderedHTML = renderToString(<MetaTagsContext extract = {metaTagsInstance.extract}>{rc}</MetaTagsContext>)
              meta = metaTagsInstance.renderToString()
              res.status(ajaxResp.statusCode).send(
                "<metaTags>" + meta + "</metaTags>\n" +
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
  })

  const PORT = serverConfig.isoPort

  app.listen(PORT, function () {
    console.log('ISO worker listening on port', PORT)
  })

  // Fire off an initial request to get the app bundle loading.
  http.get("http://localhost:4002/check", function(ajaxResp) {
    ajaxResp.on('end', function() { console.log("Initial check: code=", ajaxResp.statusCode) })
  })
//}, { count: serverConfig.isoWorkers })
