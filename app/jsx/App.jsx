
// ##### Top-level React Router App ##### //

import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, IndexRoute, Link, browserHistory, applyRouterMiddleware } from 'react-router'
import { useScroll } from 'react-router-scroll';

import HomePage from './pages/HomePage.jsx'
import BrowsePage from './pages/BrowsePage.jsx'
import UnitPage from './pages/UnitPage.jsx'
import ItemPage from './pages/ItemPage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import StaticPage from './pages/StaticPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import LoginSuccessPage from './pages/LoginSuccessPage.jsx'
import LogoutPage from './pages/LogoutPage.jsx'

class App extends React.Component 
{
  // The logout and login pages need to be able to return the user whence they
  // came. To do that, we need to keep a record when page transitions occur.
  componentWillReceiveProps(nextProps) {
    nextProps.location.prevPathname = this.props.location.pathname
  }

  render() { return(
    <div>
      {this.props.children}
    </div>
  )}
}

const routes = (
  <Route path="/" component={App}>
    <IndexRoute component={HomePage} />
    <Route path="/browse/:type" component={BrowsePage} />
    <Route path="/unit/:unitID" component={UnitPage} />
    <Route path="/item/:itemID" component={ItemPage} />
    <Route path="/search" component={SearchPage} />
    <Route path="/static/:unitID/:pageName" component={StaticPage} />
    <Route path="/login" component={LoginPage} />
    <Route path="/loginSuccess" component={LoginSuccessPage} />
    <Route path="/logout" component={LogoutPage} />
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
