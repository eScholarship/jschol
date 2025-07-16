import { StrictMode } from 'react'
// import { renderToString } from 'react-dom/server'
import ReactDOMServer from 'react-dom/server'
import App from './jsx/App.jsx'


export function render(_url) {
  const html = ReactDOMServer.renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  return { html }
}
