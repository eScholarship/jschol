import { StrictMode } from 'react'
// import { renderToString } from 'react-dom/server'
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './jsx/App.jsx'


export function render(_url, pageData) {
  const html = ReactDOMServer.renderToString(
    <StrictMode>
      <StaticRouter location={_url} context={{ pageData }}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )
  return { 
    html,
    head: `<script>window.jscholApp_initialPageData = ${JSON.stringify(pageData)};</script>`
  }
}
