/**
 * SSR Entry Point for Vite
 * This module is built by Vite and loaded by the isomorphic server
 */

import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import MetaTagsServer from 'react-meta-tags/server'
import { MetaTagsContext } from 'react-meta-tags'
import AppRoot from './jsx/App.jsx'

/**
 * Renders the application to HTML string for SSR
 * @param {string} url - The request URL
 * @param {object} pageData - The page data from Ruby server
 * @returns {object} Object with html and metaTags
 */
export function render(url, pageData) {
  const metaTagsInstance = MetaTagsServer()
  
  const renderedHTML = ReactDOMServer.renderToString(
    <StaticRouter location={url} context={{ pageData }}>
      <MetaTagsContext extract={metaTagsInstance.extract}>
        <AppRoot />
      </MetaTagsContext>
    </StaticRouter>
  )
  
  return {
    html: renderedHTML,
    metaTags: metaTagsInstance.renderToString()
  }
}

