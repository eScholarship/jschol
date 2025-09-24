import fs from 'node:fs/promises'
import express from 'express'

// the majority of this file's content is from vite's official SSR guide:
// https://vite.dev/guide/ssr

// Constants
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const base = process.env.BASE || '/'
const rubyApiUrl = `http://localhost:${process.env.PUMA_PORT || '18880'}`

// Cached production assets
const templateHtml = isProduction
  ? await fs.readFile('./dist/client/index.html', 'utf-8')
  : ''

// Create http server
const app = express()

app.use(express.json({ limit: '10mb' }))

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite
if (!isProduction) {
  const { createServer } = await import('vite')
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base,
  })
  app.use(vite.middlewares)
} else {
  const compression = (await import('compression')).default
  const sirv = (await import('sirv')).default
  app.use(compression())
  app.use(base, sirv('./dist/client', { extensions: [] }))
}

// health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    node_env: process.env.NODE_ENV,
  })
})

// helper function to fetch page data from Ruby API
async function fetchPageData(path) {
  try {
    // in production, make the call to the external hostname which nginx will route to ruby
    // in development, connect directly to ruby
    const apiUrl = process.env.NODE_ENV === 'production'
      ? `http://localhost/api/pageData${path}`
      : `http://localhost:${process.env.PUMA_PORT || '18880'}/api/pageData${path}`
    
    console.log(`Fetching from: ${apiUrl}`)
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching page data:', error)
    return { error: true, message: "Failed to load page data" }
  }
}

// Serve HTML
app.use('*all', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '')

    // better asset filtering - include source maps and vite dev files
    // TODO: there's probably a better way to do this
    if (url.match(/\.(css|js|scss|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|xml|txt|map)$/) ||
        url.includes('/@vite/') ||
        url.includes('/@react-refresh') ||
        url.includes('/node_modules/') ||
        url.startsWith('/__vite') ||
        url.endsWith('.js.map') ||
        url.endsWith('.css.map')) {
      return res.status(404).send('Asset not found')
    }

    let template
    let render
    if (!isProduction) {
      // Always read fresh template in development
      template = await fs.readFile('./index.html', 'utf-8')
      template = await vite.transformIndexHtml(url, template)
      render = (await vite.ssrLoadModule('/app/entry-server.jsx')).render
    } else {
      template = templateHtml
      render = (await import('./dist/server/entry-server.js')).render
    }

    console.log('Template loaded, fetching page data...')

    // fetch page data from Ruby API
    const pageData = await fetchPageData(req.originalUrl)
    console.log('Page data fetched:', Object.keys(pageData))

    console.log('Rendering React with URL:', req.originalUrl)
    const rendered = await render(req.originalUrl, pageData)

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? '')
      .replace(`<!--app-html-->`, rendered.html ?? '')

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html)
  } catch (e) {
    vite?.ssrFixStacktrace(e)
    if (!isProduction) {
      console.log('***SSR ERROR***', e.stack)
      res.status(500).end(e.stack)
    } else {
      res.status(500).send('Internal Server Error')
    }
    
  }
})

// Start http server
app.listen(port, () => {
  console.log(`SSR LOADED: Server listening on port: ${port}`)
})
