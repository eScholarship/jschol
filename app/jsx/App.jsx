
// ##### Top-level React Router App ##### //

import React from 'react'
import ReactDOM from 'react-dom'
import { Router, Route, IndexRoute, Link, browserHistory } from 'react-router'

import HomePage from './pages/HomePage.jsx'
import UnitPage from './pages/UnitPage.jsx';
import ItemPage from './pages/ItemPage.jsx';

const routes = (
  <Route path="/app.html" component={HomePage}>
    <IndexRoute component={HomePage} />
    <Route path="/unit/:unitID" component={UnitPage} />
    <Route path="/item/:itemID" component={ItemPage} />
  </Route>
)

// When running in the browser, render with React (vs. server-side where iso runs it for us)
if (!(typeof document === "undefined")) {
  ReactDOM.render((
    <Router history={browserHistory}>
      {routes}
    </Router>
  ), document.getElementById('main'))
}

module.exports = routes
