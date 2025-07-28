import { StrictMode } from 'react'
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './jsx/App.jsx'

// TODO: meta tags don't seem to be working
// research a vite-compatible solution (react-meta-tags is CJS)

export function render(url, pageData) {
  // simple meta tags collection during SSR
  const metaTags = []
  
  // create a context to collect meta tags during rendering
  const ssrContext = { 
    pageData,
    metaTags: {
      add: (tag) => metaTags.push(tag)
    }
  }
  
  const html = ReactDOMServer.renderToString(
    <StrictMode>
      <StaticRouter location={url} context={ssrContext}>
        <App />
      </StaticRouter>
    </StrictMode>
  )
  
  // Generate meta tags HTML
  const metaTagsHtml = metaTags.length > 0 ? metaTags.join('\n      ') : ''
  
  return { 
    html,
    head: `
      ${metaTagsHtml}
      <script>window.jscholApp_initialPageData = ${JSON.stringify(pageData)};</script>`
  }
}
