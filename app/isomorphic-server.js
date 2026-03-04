/**
 * Isomorphic Server - SSR rendering via Express
 *
 * In development (NODE_ENV != 'production'):
 *   Uses Vite's ssrLoadModule() to load the entry point at request-time through
 *   Vite's module transformer. No pre-built SSR bundle is required; file changes
 *   are picked up automatically via Vite's module graph invalidation
 *
 * In production:
 *   Loads the pre-built CJS bundle (app/js/isomorphic-bundle.cjs) once at startup
 */

import express from 'express'
import { createRequire } from 'module'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import bodyParser from 'body-parser'
import { GracefulShutdownManager } from '@moebius/http-graceful-shutdown'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'
const app = express()

app.use(bodyParser.json({limit: '10mb'}))

let getRenderFn

if (isProd) {
  const require = createRequire(import.meta.url)
  console.log('ISO: Loading SSR bundle from ./js/isomorphic-bundle.cjs')
  const bundle = require('./js/isomorphic-bundle.cjs')
  console.log('ISO: SSR bundle loaded successfully (production)')
  getRenderFn = async () => bundle.render
} else {
  const { createServer } = await import('vite')
  const vite = await createServer({
    root: resolve(__dirname, '..'),
    server: { middlewareMode: true },
    appType: 'custom',
  })
  // ssrLoadModule re-uses Vite's module graph; file changes are picked up automatically
  getRenderFn = async () => {
    const mod = await vite.ssrLoadModule('/app/isomorphic-entry.jsx')
    return mod.render
  }
  console.log('ISO: Using Vite ssrLoadModule for dev SSR (no pre-build needed)')
}

// Simple check for up-ness
app.get('/check', (req, res) => {
  res.send('ok')
})

// Main entry point for SSR
app.post('*', async (req, res) => {
  try {
    console.log('ISO: Rendering', req.url)
    const renderFn = await getRenderFn()
    const { html, metaTags } = renderFn(req.url, req.body)
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
