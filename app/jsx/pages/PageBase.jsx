
import React from 'react'
import $ from 'jquery'
import _ from 'lodash'
import { Broadcast, Subscriber } from 'react-broadcast'

import SkipNavComp from '../components/SkipNavComp.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import FooterComp from '../components/FooterComp.jsx'
import DrawerComp from '../components/DrawerComp.jsx'

// Key used to store login credentials in browser's session storage
const SESSION_LOGIN_KEY = "escholLogin"

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
      // Phase 1: Initial server-side load. We just save the URL, and iso will later fetch it and re-run React
      if (this.props.location.urlsToFetch)
          this.props.location.urlsToFetch.push(dataURL)
      // Phase 2: Second server-side load, where our data has been fetched and stored in props.location
      else if (this.props.location.urlsFetched)
        state.pageData = this.props.location.urlsFetched[this.pageDataURL(this.props)]
      // Phase 3: Initial browser load. Server should have placed our data in window.
      else if (window.jscholApp_initialPageData) {
        state.pageData = window.jscholApp_initialPageData
        delete window.jscholApp_initialPageData
      }
      // Phase 4: Browser-side page switch. We have to fetch new data ourselves. Start with basic
      // state, and the pageData will get filled when the ajax returns.
      else
        this.fetchPageData(this.props)
    }
    else
      state.pageData = {}

    // That's the final state.
    this.setState(state)
  }

  componentDidMount() {
    // Retrieve login info from session storage (but after initial init, so that ISO matches for first render)
    if (this.getSessionData()) {
      this.setState({ adminLogin:
        { loggedIn: true, username: this.getSessionData().username, token: this.getSessionData().token } })
    }
  }

  getSessionData() {
    return sessionStorage && JSON.parse(sessionStorage.getItem(SESSION_LOGIN_KEY))
  }

  onLogin = (username, token) => {
    if (!this.state.adminLogin || username != this.state.adminLogin.username || token != this.state.adminLogin.token)
    {
      if (sessionStorage)
        sessionStorage.setItem(SESSION_LOGIN_KEY, JSON.stringify({ username: username, token: token }))
      this.setState({ adminLogin: { loggedIn: true, username: username, token: token } })
    }
  };

  onLogout = () => {
    if (sessionStorage)
      sessionStorage.setItem(SESSION_LOGIN_KEY, JSON.stringify(null))
    this.setState({ adminLogin: { loggedIn: false } })
  };

  // Called when user clicks Edit Page, or Done Editing
  onEditingPageChange = flag =>
  {
    if (flag && !this.state.cmsModules) {
      // Load CMS-specific modules asynchronously
      require.ensure(['react-trumbowyg'], (require) => {
        this.setState({ isEditingPage: true,
                        cmsModules: { Trumbowyg: require('react-trumbowyg').default } })
      }, "cms") // load from webpack "cms" bundle
    }
    else
      this.setState({ isEditingPage: flag })
  };

  // Pages with any editable components should override this.
  isPageEditable() {
    return false
  }

  // Browser-side AJAX fetch of page data. Sets state when the data is returned to us.
  fetchPageData(props) {
    let dataURL = this.pageDataURL(props)
    if (dataURL) {
      this.setState({ fetchingData: true })
      $.getJSON(this.pageDataURL(props)).done((data) => {
        this.setState({ pageData: data, fetchingData: false })
      }).fail((jqxhr, textStatus, err)=> {
        this.setState({ pageData: null, error: textStatus, fetchingData: false })
      })
    }
  }

  // This gets called when props change by switching to a new page.
  // It is *not* called on first-time construction. We use it to fetch new page data
  // for the page being switched to.
  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props, nextProps)) {
      //this.setState(this.getEmptyState())   bad: this causes loss of context when clicking search facets
      setTimeout(()=>this.fetchPageData(), 0) // fetch right after setting the new props
    }
  }

  // Method to be supplied by derived classes, so they can make a URL that will grab
  // the proper API data from the server.
  pageDataURL() {
    throw "Derived class must override pageDataURL method"
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
  
  renderContent() {
    if (this.state.error) {
      return (
        <div className="body">
          {this.renderError()}
          <FooterComp/>
        </div>);
    } else if (this.state.adminLogin && this.state.adminLogin.loggedIn && this.state.pageData) {
      return (
        <DrawerComp data={this.state.pageData}>
          <div className="body">
            <SkipNavComp/>
            {this.renderData(this.state.pageData)}
            <FooterComp/>
          </div>
        </DrawerComp>);
    } else if (this.state.pageData) {
      return (
        <div className="body">
          <SkipNavComp/>
          {this.renderData(this.state.pageData)}
          <FooterComp/>
        </div>);
    } else {
      return (
        <div className="body">
          <SkipNavComp/>
          {this.renderLoading()}
          <FooterComp/>
        </div>);
    }
  }

  fetchPermissions() {
    const unit = this.pagePermissionsUnit()
    if (unit
        && this.state.adminLogin
        && this.state.adminLogin.loggedIn
        && !this.fetchingPerms
        && !this.state.permissions) 
    {
      this.fetchingPerms = true
      $.getJSON(`/api/permissions/${unit}?username=${this.state.adminLogin.username}&token=${this.state.adminLogin.token}`)
      .done((data) => {
        this.setState({ permissions: data })
      })
      .fail((jqxhr, textStatus, err)=> {
        this.setState({ error: textStatus })
      })
    }
  }

  isStageMachine() {
    let lookFor = /-stg|-dev/
    if (lookFor.test(this.props.location.host))
      return true
    else if (!((typeof window) === "undefined") && window.location && lookFor.test(window.location.origin))
      return true
    else
      return false
  }

  stageWatermark() {
    if (!this.isStageMachine())
      return null

    // You can't see them below, but there are actually a bunch of non-breaking space chars
    // in the string.
    let watermarkText = "NEW WEBSITE IN PROGRESS                "
    for (let i = 0; i < 12; i++)
      watermarkText += watermarkText
    return <div className="watermarked-parent">
             <div className="watermarked" data-watermark={watermarkText}/>
           </div>
  }

  render() {
    this.fetchPermissions()
    return (
      <div>
        { this.stageWatermark() }
        <Broadcast channel="cms" value={ { loggedIn: this.state.adminLogin && this.state.adminLogin.loggedIn,
                                           username: this.state.adminLogin && this.state.adminLogin.username,
                                           token: this.state.adminLogin && this.state.adminLogin.token,
                                           onLogin: this.onLogin,
                                           onLogout: this.onLogout,
                                           isEditingPage: this.state.isEditingPage,
                                           onEditingPageChange: this.onEditingPageChange,
                                           modules: this.state.cmsModules,
                                           permissions: this.state.permissions } }>
          {this.renderContent()}
        </Broadcast>
      </div>
    )
  }

  renderLoading() { return(
    <div>
      <Header1Comp/>
      <h2 style={{ marginTop: "5em", marginBottom: "5em" }}>Loading...</h2>
    </div>
  )}

  renderError() { return (
    <div>
      <Header1Comp/>
      <h2 style={{ marginTop: "5em", marginBottom: "5em" }}>Unable to reach the server: {this.state.error}</h2>
    </div>
  )}

}

module.exports = PageBase
