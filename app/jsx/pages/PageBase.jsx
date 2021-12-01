
import React from 'react'
import Helmet from 'react-helmet'
import $ from 'jquery'
import _ from 'lodash'
import ReactGA from 'react-ga'
import Contexts from '../contexts.jsx'
import { Link } from 'react-router-dom'

import SkipNavComp from '../components/SkipNavComp.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import FooterComp from '../components/FooterComp.jsx'
import DrawerComp from '../components/DrawerComp.jsx'
import TestMessageComp from '../components/TestMessageComp.jsx'
import ScrollToTopComp from '../components/ScrollToTopComp.jsx'
import NavComp from '../components/NavComp.jsx'
import ServerErrorComp from '../components/ServerErrorComp.jsx'
import MetaTagsComp from '../components/MetaTagsComp.jsx'
import NavBarComp from '../components/NavBarComp.jsx'

// Keys used to store CMS-related data in browser's session storage
const SESSION_LOGIN_KEY = "escholLogin"
const SESSION_EDITING_KEY = "escholEditingPage"

// Session storage is not available on server, only on browser
let sessionStorage = (typeof window != "undefined") ? window.sessionStorage : null

class PageBase extends React.Component
{
  getEmptyState() {
    return {
      pageData: null,
      isEditingPage: false,
      cmsModules: null
    }
  }

  // We initialize state here instead of in the constructor because, for some cases, it'll
  // result in starting an asynchronous fetch, and there would be a danger that fetch comes
  // back before the component is ready to receive state.
  componentWillMount() {
    let state = this.getEmptyState()
    let dataURL = this.pageDataURL(this.props)
    if (dataURL)
    {
      // Phase 1: Server-side load, where our page data has been precalculated and stored in props.staticContext
      if (this.props.staticContext && this.props.staticContext.pageData) {
        state.fetchingData = false
        state.pageData = this.props.staticContext.pageData
      }
      // Phase 2: Initial browser load. Server should have placed our data in window.
      else if (!(typeof window === "undefined") && window.jscholApp_initialPageData) {
        state.fetchingData = false
        state.pageData = window.jscholApp_initialPageData
        delete window.jscholApp_initialPageData
      }
      // Phase 3: Browser-side page switch. We have to fetch new data ourselves. Start with basic
      // state, and the pageData will get filled when the ajax returns.
      else {
        state.fetchingData = true
        this.fetchPageData(this.props)
      }
    }
    else
      state.pageData = {}

    // That's the final state.
    this.setState(state)
  }

  componentDidMount() {
    // Retrieve login info from session storage (but after initial init, so that ISO matches for first render)
    let d = this.getSessionData()
    if (d) {
      setTimeout(() =>{
        this.setState({ adminLogin: { loggedIn: true, username: d.username, token: d.token },
                        isEditingPage: d.isEditingPage })
        setTimeout(() =>this.fetchPermissions(), 0)
      }, 0)
    }
  }

  getSessionData() {
    return sessionStorage && JSON.parse(sessionStorage.getItem(SESSION_LOGIN_KEY))
  }

  setSessionData(data) {
    return sessionStorage && sessionStorage.setItem(SESSION_LOGIN_KEY, JSON.stringify(data))
  }

  onLogin = (username, token) => {
    if (!this.state.adminLogin || username != this.state.adminLogin.username || token != this.state.adminLogin.token)
    {
      this.setSessionData({ username: username, token: token })
      this.setState({ adminLogin: { loggedIn: true, username: username, token: token },
                      isEditingPage: false })
    }
  };

  onLogout = () => {
    this.setSessionData(null)
    this.setState({ adminLogin: { loggedIn: false } })
  };

  // Called when user clicks Edit Page, or Done Editing
  onEditingPageChange = flag => {
    this.setSessionData(Object.assign(this.getSessionData(), { isEditingPage: flag }))
    this.setState({ isEditingPage: flag })
  }

  // Pages with any editable components should override this.
  isPageEditable() {
    return false
  }

  // Browser-side AJAX fetch of page data. Sets state when the data is returned to us.
  fetchPageData = props => {
    this.dataURL = this.pageDataURL(props)
    let urlFetching = this.dataURL
    if (this.dataURL) {
      let finalURL = this.pageDataURL(props)
      let d = this.getSessionData()
      if (d) {
        finalURL += (finalURL.indexOf("?") < 0) ? "?" : "&"
        finalURL += "username=" + d.username + "&token=" + d.token
      }
      this.setState({ fetchingData: true, 
                      permissions: (this.state && this.pagePermissionsUnit() == this.state.permissionsUnit)
                        ? this.state.permissions : null })
      $.getJSON(finalURL).done((data) => {
        if (urlFetching == this.dataURL) {
          this.setState({ pageData: data, fetchingData: false })
          if (this.pagePermissionsUnit() != this.state.permissionsUnit)
            this.fetchPermissions()
        }
        else {
          // Another page was fetched before data for first page came back. Toss the first.
          console.log("Note: discarding obsolete API data from:", urlFetching)
        }
      }).fail((jqxhr, textStatus, err) => {
        let message = (jqxhr.responseJSON && jqxhr.responseJSON.message) ? jqxhr.responseJSON.message :
                      (textStatus=="error" && err) ? err :
                      textStatus ? textStatus :
                      "error"
        this.setState({ pageData: { error: message }, fetchingData: false })
      })
    }
    else {
      this.setState({ fetchingData: false, permissions: null })
    }
  }

  // Send API data (e.g. to edit page contents) and go to a new URL or refresh page data
  sendApiData = (method, apiURL, data) => {
    this.setState({ fetchingData: true })
    $.getJSON({ type: method, url: apiURL,
                data: _.merge(_.cloneDeep(data),
                        { username: this.state.adminLogin.username, token: this.state.adminLogin.token })})
    .done(data=>{
      if (data.nextURL) {
        // Setting permissionsUnit to null results in forcing reload of permissions data
        // (needed if new page has been created)
        this.setState({ fetchingData: false, permissionsUnit: null })
        this.props.history.push(data.nextURL)
      }
      else {
        this.fetchPermissions(true)
        this.fetchPageData()
      }
    })
    .fail(data=>{
      alert("Error" + (data.responseJSON ? `:\n${data.responseJSON.message}`
                                         : ` ${data.status}:\n${data.statusText}.`))
      this.fetchPermissions(true)
      this.fetchPageData()
    })
  }

  sendBinaryFileData = (method, apiURL, formData) => {
    this.setState({ fetchingData: true })
    formData.append('username', this.state.adminLogin.username)
    formData.append('token', this.state.adminLogin.token)

    $.ajax({
      type: method,
      url: apiURL,
      data: formData,
      contentType: false,
      processData: false
    })
    .done(data=>{
      if (data.nextURL) {
        this.setState({ fetchingData: false })
        this.props.history.push(data.nextURL)
      }
      else
        this.fetchPageData()
    })
    .fail(data=>{
      alert("Error" + (data.responseJSON ? `:\n${data.responseJSON.message}`
                                         : ` ${data.status}:\n${data.statusText}.`))
      this.fetchPageData()
    })
  }

  // External Google Analytics trackers
  runExtGATracker = (tracker, id) => {
    ReactGA.ga('create', id, 'auto', {'name': tracker})
    ReactGA.ga(tracker+'.send', 'pageview', {'page': window.location.pathname})
  }

  extGA = (unit_id) => {
    if (!(typeof window === "undefined")) {
      if (/jmie_sfews/.test(unit_id)) { this.runExtGATracker('sfewsTracker', 'UA-31540406-1') }
      if (/^nanocad/.test(unit_id)) { this.runExtGATracker('nanocadTracker', 'UA-17962781-1') }
      if (/^uciem_westjem/.test(unit_id)) { this.runExtGATracker('westjemTracker', 'UA-34762732-1') }
      if (/^ucla_epss/.test(unit_id)) { this.runExtGATracker('epssTracker', 'UA-111990925-2') }
      if (/^refract/.test(unit_id)) { this.runExtGATracker('refractTracker', 'UA-130336975-1') }      
      if (/^itsdavis_ncst/.test(unit_id)) { this.runExtGATracker('itsdavisncstTracker', 'UA-54945925-1') } 
      if (/^acgcc_jtas/.test(unit_id)) { this.runExtGATracker('jtasTracker', 'UA-141570725-1') } 
      if (/^psf/.test(unit_id)) { this.runExtGATracker('psfTracker', 'UA-152312010-1') }
      if (/^cioa_ciap/.test(unit_id)) { this.runExtGATracker('ciapTracker', 'UA-164954982-1') }
      if (/^lawandpoliticaleconomy/.test(unit_id)) { this.runExtGATracker('lawandpoliticaleconomyTracker', 'UA-187281152-1') }
      if (/^energy_ambitions/.test(unit_id)) { this.runExtGATracker('energyambitionsTracker', 'UA-192190770-1') }
    }
  }
 
  
  // This gets called when props change by switching to a new page.
  // It is *not* called on first-time construction. We use it to fetch new page data
  // for the page being switched to, if the URL has changed.
  componentWillReceiveProps(nextProps) {
    if (this.props.location.pathname != nextProps.location.pathname ||
        this.props.location.search != nextProps.location.search)
    {
      //this.setState(this.getEmptyState())   bad: this causes loss of context when clicking search facets
      this.setState({ fetchingData: true })
      setTimeout(() => this.fetchPageData(), 0) // fetch right after setting the new props
    }
  }

  // This has been made uniform to simplify iso rendering. Server will figure out which API based on the path.
  pageDataURL() {
    return "/api/pageData" + this.props.location.pathname + this.props.location.search
  }

  // Optional method: for editable pages, the unit ID to look up permissions for
  pagePermissionsUnit() {
    return null
  }

  // Method to be supplied by derived classes, so they can make a URL that will grab
  // the proper API data from the server.
  renderData() {
    throw "Derived class must override renderData method"
  }

  // Most pages want header and footer (automatically)
  needHeaderFooter() {
    return true
  }

  shouldShowDrawer() {
    return this.state.adminLogin && this.state.adminLogin.loggedIn &&
           this.state.cmsModules && this.state.pageData &&
           this.state.permissions && this.state.permissions.admin &&
           'header' in this.state.pageData && 'nav_bar' in this.state.pageData.header &&
           !this.state.pageData.id
  }

  renderContent() {
    // Error case
    if (this.state.pageData && this.state.pageData.error !== undefined) {
      return (
        <div className="body">
          {this.renderError()}
          <div className="c-toplink">
            <a href="javascript:window.scrollTo(0, 0)">Top</a>
          </div>
          {this.needHeaderFooter() && <FooterComp/>}
        </div>)
    }

    // CMS drawer case
    if (this.shouldShowDrawer()) {
      return (
        <DrawerComp data={this.state.pageData}
                    sendApiData={this.sendApiData}
                    sendBinaryFileData={this.sendBinaryFileData}
                    fetchingData={this.state.fetchingData}>
          {/* Not sure why the padding below is needed, but it is */}
          <div className="body" style={{ padding: "20px" }}>
            {this.needHeaderFooter() && <SkipNavComp/>}
            {this.state.pageData ? this.renderData(this.state.pageData) : this.renderLoading()}
            {this.needHeaderFooter() && <FooterComp/>}
          </div>
        </DrawerComp>)
    }

    // Normal case
    return (
      <div className="body">
        {/* Mathjax is fun and awesome */}
        <Helmet>
          <script id="MathJaxConfig" src="/js/mathjax-config.js"/>
          <script id="MathJax-script" async
            src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js">
          </script>
        </Helmet>
        {this.needHeaderFooter() && <SkipNavComp/>}
        {this.state.pageData ? this.renderData(this.state.pageData) : this.renderLoading()}
        {this.needHeaderFooter() &&
          <div>
            <div className="c-toplink">
              <a href="javascript:window.scrollTo(0, 0)">Top</a>
            </div>
            <FooterComp/>
          </div>
        }
      </div>)
  }

  fetchPermissions(refetch) {
    const unit = this.pagePermissionsUnit()
    if (unit
        && this.state.adminLogin
        && this.state.adminLogin.loggedIn
        && !this.state.fetchingPerms
        && (refetch || !this.state.permissions))
    {
      this.setState({ fetchingPerms: true })
      $.getJSON(
        `/api/permissions/${unit}?username=${this.state.adminLogin.username}&token=${this.state.adminLogin.token}`)
      .done((data) => {
        if (data.error) {
          this.setSessionData(null)
          this.setState({ fetchingPerms: false, adminLogin: null, permissions: null, isEditingPage: false })
          alert("Login note: " + data.message)
        }
        else {
          this.setState({ fetchingPerms: false, permissions: data, permissionsUnit: unit })
          if (!this.state.cmsModules) {
            // Load CMS-specific modules asynchronously
            require.ensure(['../objects/TrumbowygObj.jsx', 'react-sidebar', 'react-sortable-tree'], (require) => {
              this.setState({ cmsModules: { Trumbowyg: require('../objects/TrumbowygObj.jsx').default,
                                            Sidebar: require('react-sidebar').default,
                                            SortableTree: require('react-sortable-tree').default } })
            }, "cms") // load from webpack "cms" bundle
          }
        }
      })
      .fail((jqxhr, textStatus, err) => {
        this.setState({ pageData: { error: textStatus }, fetchingPerms: false,
                        adminLogin: null, permissions: null, isEditingPage: false })
      })
    }
  }

  render() {
    // If ScrollToTopComp gives you trouble, you can disable by replacing it with a plain <div>
    return (
      <ScrollToTopComp>
        <Contexts.CMS.Provider value={ { loggedIn: this.state.adminLogin && this.state.adminLogin.loggedIn,
                                             username: this.state.adminLogin && this.state.adminLogin.username,
                                             token: this.state.adminLogin && this.state.adminLogin.token,
                                             onLogin: this.onLogin,
                                             onLogout: this.onLogout,
                                             isEditingPage: this.state.adminLogin && this.state.adminLogin.loggedIn &&
                                                            this.state.isEditingPage,
                                             onEditingPageChange: this.onEditingPageChange,
                                             fetchPageData: () =>this.fetchPageData(this.props),
                                             goLocation: (loc) =>this.props.history.push(loc),
                                             modules: this.state.cmsModules,
                                             showingDrawer: this.shouldShowDrawer(),
                                             permissions: this.state.permissions } }>
          {this.renderContent()}
        </Contexts.CMS.Provider>
      </ScrollToTopComp>
    )
  }

  renderLoading() { return(
    <div>
      {this.needHeaderFooter() && <Header1Comp/>}
      <h2 style={{ marginTop: "5em", marginBottom: "5em" }}>Loading...</h2>
    </div>
  )}

  renderError() {
    let data = this.state.pageData
    let message = data.message ? data.message : data.error ? data.error : null
    return (
    <div>
      <MetaTagsComp title={message}/>
      <Header1Comp/>
      {data.header && data.unit &&
        <NavBarComp navBar={data.header.nav_bar} unit={data.unit} socialProps={data.header.social} />}
      {data.header && !data.unit &&
        <div className="c-navbar">
          <NavComp data={data.header.nav_bar} />
        </div>
      }
      <div className="c-columns">
        <main id="maincontent">
          <section className="o-columnbox1">
            <ServerErrorComp error={message}/>
          </section>
        </main>
      </div>
    </div>
  )}

}

export default PageBase
