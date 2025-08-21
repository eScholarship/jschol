// import './index.css'
// import './scss/main.scss'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import App from './jsx/App.jsx'
import jQuery from 'jquery'
window.$ = jQuery
window.jQuery = jQuery

ReactDOM.hydrate(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
  document.getElementById('root'),
)
