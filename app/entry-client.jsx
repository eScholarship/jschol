// import './index.css'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import App from './jsx/App.jsx'

ReactDOM.hydrate(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById('root'),
)
