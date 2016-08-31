
import express                   from 'express';
import url                       from 'url';
import React                     from 'react';
import { renderToString }        from 'react-dom/server'
import { Router, RouterContext, match }  from 'react-router';
import routes                    from './jsx/app.jsx';

const app = express();

class Fetcher
{
  constructor(refURL) {
    this.refURL = refURL
  }

  isoFetchJSON = (partialURL)=> {
    console.log("isoFetchJSON:", url)
    var finalURL = url.resolve(this.refURL, partialURL).replace(":4002", ":4001")
    console.log("finalURL:", finalURL)

    http.get(fullURL, function(res) {
      var body = '';
      res.on('data', function(chunk) {
        body += chunk;
      });
      res.on('end', function(){
        if (res.statusCode == 200) {
          var response = JSON.parse(body);
          console.log("Got a response:", response);
          callback(response)
        }
        else {
          console.log("HTTP Error " + res.statusCode + ": " + body)
        }
      });
    }).on('error', function(e) {
      console.log("Got an error: ", e);
    }); 
  }
}

const http = (typeof window === 'undefined') ? require('http') : null

function flexibleGetJSON(url, callback)
{
  if (typeof window === 'undefined') {
    var fullURL = "http://localhost:4001" + url
    console.log("Doing node http.get:", fullURL)
  }
  else {
    console.log("Doing jquery getJSON")
    $.getJSON(url).done(callback)
  }
}


app.use((req, res) => {
  match({ routes: routes, location: req.url }, (err, redirectLocation, renderProps) => {
    if (err) { 
      console.error(err);
      return res.status(500).end('Internal server error');
    }
    if (!renderProps) return res.status(404).end('Not found.');
    var rc = <RouterContext {...renderProps} />
    rc.props.location.urlsToFetch = []
    res.send(renderToString(rc))
  });
});

export default app;