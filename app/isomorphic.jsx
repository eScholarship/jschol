
import express                   from 'express';
import url                       from 'url';
import http                      from 'http'
import React                     from 'react';
import { renderToString }        from 'react-dom/server'
import { Router, RouterContext, match }  from 'react-router';
import decache                   from 'decache';
import fs                        from 'fs';

var lastStamp
var routes = null

const app = express();

app.use((req, res) =>
{
  // Simple check for up-ness
  if (req.originalUrl == "/check") {
    res.send("ok")
    return
  }

  // Cache the app code. We can base the cache on the app bundle.
  var curStamp = new Date(fs.statSync("app/js/app-bundle.js").mtime)
  if ((lastStamp - curStamp) != 0) {
    console.log("ISO: Loading new app bundle.")
    lastStamp = curStamp
    if (routes)
      decache('./jsx/App.jsx');
    routes = require('./jsx/App.jsx');
    console.log("ISO: Bundle loaded.")
  }

  // Now route the request
  var refURL = req.protocol + '://' + req.get('host') + req.originalUrl
  console.log("ISO fetch:", refURL)
  match({ routes: routes, location: req.url }, (err, redirectLocation, renderProps) => {
    if (err) { 
      console.error(err);
      return res.status(500).end('Internal server error');
    }
    if (!renderProps) return res.status(404).end('Not found.');
    var rc = <RouterContext {...renderProps} />
    var urls = []
    rc.props.location.urlsToFetch = urls
    var renderedHTML = renderToString(rc)
    if (urls.length == 0)
      res.send("<div id=\"main\">" + renderedHTML + "</div>")
    else if (urls.length == 1)
    {
      var partialURL = urls[0]
      var finalURL = url.resolve(refURL, partialURL).replace(":4002", ":4001")
      console.log("...integrating data from:", finalURL)

      http.get(finalURL, function(ajaxResp) {
        var body = '';
        ajaxResp.on('data', function(chunk) {
          body += chunk;
        });
        ajaxResp.on('end', function() 
        {
          try {
            if (ajaxResp.statusCode == 200) {
              var response = {}
              try {
                response = JSON.parse(body)
              }
              catch (e) {
                console.log("Exception parsing JSON:", e)
              }
              //console.log("Got a response:", response)
              delete rc.props.location.urlsToFetch
              rc.props.location.urlsFetched = {}
              rc.props.location.urlsFetched[partialURL] = response
              renderedHTML = renderToString(rc)
              /* Note: must leave comments like <!-- react-text: 14 --> so that react will
                 properly match up the rendered HTML to client-generated HTML */
              res.send(
                "<script>window.jscholApp_initialPageData = " + body + ";</script>\n" +
                "<div id=\"main\">" + renderedHTML + "</div>")
            }
            else
              throw "HTTP Error " + ajaxResp.statusCode + ": " + body
          }
          catch (e) {
            console.log("Exception generating React HTML:", e)
            res.status(500).send("Exception generating React HTML")
          }
        });
      }).on('error', function(e) {
        console.log("Got HTTP error " + e)
        res.status(500).send("Got HTTP error " + e)
      });
    }
    else
      throw "Internal error: currently support only one url in urlsToFetch"
  });
});

export default app;
