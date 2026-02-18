/**
 * Isomorphic Server - SSR with Vite Pre-built Bundle
 * Replaces the old @babel/register approach with pre-built bundles from Vite
 */

import express from 'express'
import { createRequire } from 'module'
import bodyParser from 'body-parser'
import { GracefulShutdownManager } from '@moebius/http-graceful-shutdown'

const require = createRequire(import.meta.url)
const app = express()

app.use(bodyParser.json({limit: '10mb'}))

// Load the SSR bundle once on startup
console.log('ISO: Loading SSR bundle from ./js/isomorphic-bundle.cjs')
const bundle = require('./js/isomorphic-bundle.cjs')
const renderFunction = bundle.render
console.log('ISO: SSR bundle loaded successfully')
console.log('ISO: render function type:', typeof renderFunction)

// Simple check for up-ness
app.get('/check', (req, res) => {
  res.send('ok')
})

// Main entry point for SSR
app.post('*', (req, res) => {
  try {
    console.log('ISO: Rendering', req.url)
    
    // Call the render function from the Vite-built bundle
    const result = renderFunction(req.url, req.body)
    
    const { html, metaTags } = result
    
    res.send(
      '<metaTags>' + metaTags + '</metaTags>\n' +
      '<div id="main">' + html + '</div>'
    )
  } catch (e) {
    console.log('ISO: Exception generating React HTML:', e)
    console.log(e.stack)
    res.status(500).send(e.message || 'SSR error')
  }
})

const PORT = process.env.ISO_PORT || 4002

const server = app.listen(PORT, function () {
  console.log('ISO: Worker listening on port ' + PORT + '.')
})

const shutdownManager = new GracefulShutdownManager(server)

process.on('SIGTERM', () => {
  shutdownManager.terminate(() => {
    console.log('ISO: worker terminated.')
  })
})

