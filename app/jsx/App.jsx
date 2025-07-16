
// ##### Top-level React Router App ##### //
// if (!(typeof document === "undefined")) {
  // require('babel-polyfill')   // do we need this?
  // require('details-polyfill')
  // require('intersection-observer')
  // require('smoothscroll-polyfill').polyfill();
// }

import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import ReactGA from 'react-ga'
import ReactModal from 'react-modal'
import klaroConfig from './klaro-config.jsx';
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


/* There are a bunch of React warnings that we can't do anything about because they're
   caused by dependencies we can't easily upgrade. Rather than have them occupying our
   eyes all the time, filter them out until/if we actually need to upgrade.
*/
let anyFiltered = false
function filterMsg(originalFunc, ...args) {
  if (/componentWillMount has been renamed/.test(args[0]) ||
      /A future version of React will block javascript: URLs/.test(args[0]) ||
      /Failed prop type/.test(args[0]) ||
      /componentWillReceiveProps has been renamed/.test(args[0]) ||
      /useLayoutEffect does nothing on the server/.test(args[0]) ||
      /Prop .* did not match.*dangerouslySetInnerHTML/s.test(args.toString()) ||
      /Expected server HTML to contain a matching.*MathJax/s.test(args.toString()))
  {
    if (!anyFiltered)
      o_warn("Note: jschol react warning(s) filtered out. Disable filtering if upgrading.")
    anyFiltered = true
  }
  else
    originalFunc.apply(console, args)
}

const o_warn  = console.warn;  console.warn  = function(...args) { filterMsg(o_warn, ...args)  }
const o_log   = console.log;   console.log   = function(...args) { filterMsg(o_log, ...args)   }
const o_debug = console.debug; console.debug = function(...args) { filterMsg(o_debug, ...args) }
const o_error = console.error; console.error = function(...args) { filterMsg(o_error, ...args) }
const o_info  = console.info;  console.info  = function(...args) { filterMsg(o_info, ...args)  }

// array-include polyfill for older browsers (and node.js)
Array.prototype.includes = require('array-includes').shim()

ReactGA.initialize('UA-26286226-1', { debug: false })

let prevPathname = null

class RecordLocation extends React.Component
{
  // Use Klaro to manage cookie consent
  componentDidMount() {
    // Check if window is defined to ensure the Klaro code runs in a browser
    // environment (not ISO/server side rendering)
    if (typeof window !== 'undefined') {
      // Dynamically import Klaro only in the browser environment
      import('klaro').then((Klaro) => {
        window.Klaro = Klaro;
        // Ensure klaroConfig is defined before using it
        if (typeof klaroConfig !== 'undefined' && klaroConfig !== null) {
          // console.log('klaroConfig is defined:', klaroConfig);
          window.Klaro.setup(klaroConfig);
        } else {
          console.error('klaroConfig is not defined');
        }
      }).catch((error) => {
        console.error('Error loading Klaro:', error);
      });
    }
  }
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
