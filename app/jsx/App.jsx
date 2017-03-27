
// ##### Top-level React Router App ##### //

import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, IndexRoute, Link, browserHistory, applyRouterMiddleware } from 'react-router'
import { useScroll } from 'react-router-scroll'
import { Broadcast } from 'react-broadcast'

import HomePage from './pages/HomePage.jsx'
import BrowsePage from './pages/BrowsePage.jsx'
import UnitPage from './pages/UnitPage.jsx'
import ItemPage from './pages/ItemPage.jsx'
import { SearchPage } from './pages/SearchPage.jsx';
import StaticPage from './pages/StaticPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import LoginSuccessPage from './pages/LoginSuccessPage.jsx'
import LogoutPage from './pages/LogoutPage.jsx'
import LogoutSuccessPage from './pages/LogoutSuccessPage.jsx'

// array-include polyfill for older browsers (and node.js)
Array.prototype.includes = require('array-includes').shim()

// Session storage is not available on server, only on browser
let sessionStorage = (typeof window != "undefined") ? window.sessionStorage : null

const SESSION_LOGIN_KEY = "escholAdminLogin"

class App extends React.Component 
{
  state = { adminLogin: null } // filled in by componentWillMount

  render() { return(
    <Broadcast channel="adminLogin" value={this.state.adminLogin}>
      {this.props.children}
    </Broadcast>
  )}

  componentWillMount() {
    const data = sessionStorage && JSON.parse(sessionStorage.getItem(SESSION_LOGIN_KEY))
    data ? this.onLogin(data.username, data.token) : this.onLogout()
  }

  onLogin = (username, token) => {
    if (sessionStorage)
      sessionStorage.setItem(SESSION_LOGIN_KEY, JSON.stringify({ username: username, token: token }))
    this.setState({ 
      adminLogin: { 
        loggedIn: true, username: username, token: token, onLogout: this.onLogout
      } 
    })
  }

  onLogout = () => {
    if (sessionStorage)
      sessionStorage.setItem(SESSION_LOGIN_KEY, JSON.stringify(null))
    this.setState({ adminLogin: { loggedIn: false, onLogin: this.onLogin } })
  }

  // The logout and login pages need to be able to return the user whence they
  // came. To do that, we need to keep a record when page transitions occur.
  componentWillReceiveProps(nextProps) {
    nextProps.location.prevPathname = this.props.location.pathname
  }
}

const routes = (
  <Route path="/" component={App}>
    <IndexRoute component={HomePage} />
    <Route path="/browse/:browse_type" component={BrowsePage} />
    <Route path="/browse/depts/:campusID" component={BrowsePage} />
    <Route path="/unit/:unitID" component={UnitPage} />
    <Route path="/unit/:unitID/:pageName" component={UnitPage} />
    <Route path="/item/:itemID" component={ItemPage} />
    <Route path="/search" component={SearchPage} />
    <Route path="/static/:unitID/:pageName" component={StaticPage} />
    <Route path="/login" component={LoginPage} />
    <Route path="/loginSuccess" component={LoginSuccessPage} />
    <Route path="/logout" component={LogoutPage} />
    <Route path="/logoutSuccess" component={LogoutSuccessPage} />
    <Route path="*" component={NotFoundPage}/>
  </Route>
)

// When running in the browser, render with React (vs. server-side where iso runs it for us)
if (!(typeof document === "undefined")) {
  ReactDOM.render((
    // useScroll() below is a fix so that transitioning to a new page always scrolls to the top.
    <Router history={browserHistory} render={applyRouterMiddleware(useScroll())}>
      {routes}
    </Router>
  ), document.getElementById('main'))
}

module.exports = routes
