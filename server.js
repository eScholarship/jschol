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

// proxy API requests to Ruby server
app.use('/api', async (req, res) => {
  try {
    const url = `${rubyApiUrl}${req.originalUrl}`
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    })
    
    const data = await response.text()
    res.status(response.status)
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json')
    res.send(data)
  } catch (error) {
    console.error('API proxy error:', error)
    res.status(500).json({ error: 'API request failed' })
  }
})

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

// helper function to fetch page data from Ruby API
async function fetchPageData(path) {
  try {
    const url = `${rubyApiUrl}/api/pageData${path}`
    const response = await fetch(url)
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

    console.log('SSR Request for:', url)

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
    console.log('***SSR ERROR***', e.stack)
    res.status(500).end(e.stack)
  }
})

// Start http server
app.listen(port, () => {
  console.log(`SSR LOADED: Server listening on port: ${port}`)
})
