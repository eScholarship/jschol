// Make jQuery available globally for plugins (trumbowyg, etc.)
import jQuery from 'jquery'
window.$ = window.jQuery = jQuery

// Import global styles
import './app/scss/main.scss'

import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import ReactModal from 'react-modal'
import App from './app/jsx/App.jsx'

ReactModal.setAppElement('#main')

if (window.jscholApp_initialPageData) {
  ReactDOM.hydrate(
    <BrowserRouter><App /></BrowserRouter>,
    document.getElementById('main')
  )
} else {
  ReactDOM.render(
    <BrowserRouter><App /></BrowserRouter>,
    document.getElementById('main')
  )
}
