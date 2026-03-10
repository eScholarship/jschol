/**
 * Client Entry Point for Vite
 * This is the main entry for the browser bundle
 */

// Make jQuery available globally for plugins (trumbowyg, etc.)
import jQuery from 'jquery'
window.$ = window.jQuery = jQuery

// Import global styles
import './scss/main.scss'

// Import and export the App component
export { default } from './jsx/App.jsx'

