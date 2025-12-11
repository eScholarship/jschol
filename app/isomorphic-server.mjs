/**
 * Isomorphic Server - SSR with Vite Pre-built Bundle
 * Replaces the old @babel/register approach with pre-built bundles from Vite
 */

import express from 'express'
import { createRequire } from 'module'
import fs from 'fs'
import bodyParser from 'body-parser'
import { GracefulShutdownManager } from '@moebius/http-graceful-shutdown'

const require = createRequire(import.meta.url)
const app = express()

app.use(bodyParser.json({limit: '10mb'}))

let lastStamp = null
let renderFunction = null

/**
 * Load or reload the SSR bundle
 * Watches the bundle file's modification time to detect rebuilds
 */
function loadSSRBundle() {
  const bundlePath = './js/isomorphic-bundle.cjs'
  
  if (!fs.existsSync(bundlePath)) {
    console.log('ISO: SSR bundle not found. Run `npm run build:ssr` first.')
    return false
  }
  
  const curStamp = new Date(fs.statSync(bundlePath).mtime)
  
  if (!lastStamp || (curStamp - lastStamp) !== 0) {
    console.log('ISO: Loading SSR bundle...')
    lastStamp = curStamp
    
    // Clear the require cache for this module
    delete require.cache[require.resolve(bundlePath)]
    
    // Load the bundle
    const bundle = require(bundlePath)
    renderFunction = bundle.render
    
    console.log('ISO: SSR bundle loaded.')
    return true
  }
  
  return true
}

// Simple check for up-ness
app.get('/check', (req, res) => {
  loadSSRBundle()
  res.send('ok')
})

// Main entry point for SSR
app.post('*', (req, res) => {
  // Make sure bundle is loaded
  if (!loadSSRBundle() || !renderFunction) {
    res.status(500).send('SSR bundle not available')
    return
  }
  
  try {
    // Call the render function from the Vite-built bundle
    const { html, metaTags } = renderFunction(req.url, req.body)
    
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
  
  // Try to load bundle on startup
  loadSSRBundle()
})

const shutdownManager = new GracefulShutdownManager(server)

process.on('SIGTERM', () => {
  shutdownManager.terminate(() => {
    console.log('ISO: worker terminated.')
  })
})

