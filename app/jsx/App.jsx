
// ##### Top-level React Router App ##### //
if (!(typeof document === "undefined")) {
  require('babel-polyfill')   // do we need this?
  require('details-polyfill')
  require('intersection-observer')
  require('smoothscroll-polyfill').polyfill();
}

import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import ReactGA from 'react-ga'
import ReactModal from 'react-modal'

import HomePage from './pages/HomePage.jsx'
import BrowsePage from './pages/BrowsePage.jsx'
import ItemPage from './pages/ItemPage.jsx'
import { UnitStatsPage, AuthorStatsPage } from './pages/StatsPage.jsx'
import UnitPage from './pages/UnitPage.jsx'
import { SearchPage } from './pages/SearchPage.jsx';
import GlobalStaticPage from './pages/GlobalStaticPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import LoginSuccessPage from './pages/LoginSuccessPage.jsx'
import LogoutPage from './pages/LogoutPage.jsx'
import LogoutSuccessPage from './pages/LogoutSuccessPage.jsx'
import UserAccountPage from './pages/UserAccountPage.jsx'

// array-include polyfill for older browsers (and node.js)
Array.prototype.includes = require('array-includes').shim()

ReactGA.initialize('UA-26286226-1', { debug: false })

let prevPathname = null

class RecordLocation extends React.Component
{
  render = () => {
    if (this.props.location.pathname != prevPathname) {
      this.props.location.prevPathname = prevPathname
      prevPathname = this.props.location.pathname
      if (!(typeof document === "undefined")) {
        ReactGA.set({ page: window.location.pathname + window.location.search,
                      anonymizeIp: true })
        ReactGA.pageview(window.location.pathname + window.location.search)
      }
    }
    return null
  }
}

class App extends React.Component
{
  render = () =>
    <div>
      <Route path="*" component={RecordLocation} />
      <Switch> {/* only one route below will match */}
        <Route exact path="/" component={HomePage} />
        <Route exact path="/campuses" component={BrowsePage} />
        <Route exact path="/journals" component={BrowsePage} />
        <Route exact path="/:campusID/units" component={BrowsePage} />
        <Route exact path="/:campusID/journals" component={BrowsePage} />
        <Route exact path="/uc/item/:itemID" component={ItemPage} />
        <Route exact path="/uc/author/:personID/stats" component={AuthorStatsPage} />
        <Route exact path="/uc/author/:personID/stats/:pageName" component={AuthorStatsPage} />
        <Route exact path="/uc/:unitID/stats" component={UnitStatsPage} />
        <Route exact path="/uc/:unitID/stats/:pageName" component={UnitStatsPage} />
        <Route exact path="/uc/:unitID" component={UnitPage} />
        <Route       path="/uc/:unitID/:pageName/*" component={UnitPage} />
        <Route exact path="/uc/:unitID/:pageName" component={UnitPage} />
        <Route       path="/uc/:unitID/*" component={UnitPage} />
        <Route exact path="/search" component={SearchPage} />
        <Route exact path="/login" component={LoginPage} />
        <Route exact path="/loginSuccess" component={LoginSuccessPage} />
        <Route       path="/loginSuccess/*" component={LoginSuccessPage} />
        <Route exact path="/logout" component={LogoutPage} />
        <Route exact path="/logoutSuccess" component={LogoutSuccessPage} />
        <Route       path="/logoutSuccess/*" component={LogoutSuccessPage} />
        <Route       path="/userAccount/:userID" component={UserAccountPage} />
        <Route path="*" component={GlobalStaticPage}/> {/* both global static, and 404 catch-all */}
      </Switch>
    </div>
}

// When running in the browser, render with React (vs. server-side where iso runs it for us)
if (!(typeof document === "undefined")) {
  ReactModal.setAppElement('#main')
  if (window.jscholApp_initialPageData) {
    ReactDOM.hydrate((
      <BrowserRouter>
        <App/>
      </BrowserRouter>
    ), document.getElementById('main'))
  }
  else {
    ReactDOM.render((
      <BrowserRouter>
        <App/>
      </BrowserRouter>
    ), document.getElementById('main'))
  }
}

// When running on the server, return an object that iso can render.
export default App
