
import React from 'react'
import $ from 'jquery'
import HeaderComp from '../components/HeaderComp.jsx'
import NavComp from '../components/NavComp.jsx'
import FooterComp from '../components/FooterComp.jsx'

let sessionStorage = (typeof window != "undefined") ? window.sessionStorage : null

class PageBase extends React.Component
{
  constructor(props) {
    super(props)
    this.state = {
      pageData: null,
      loggedIn: (sessionStorage && sessionStorage.getItem('loggedIn')) ? 
                JSON.parse(sessionStorage.getItem('loggedIn')) : null
    }

    let dataURL = this.pageDataURL(props)
    if (dataURL) 
    {
      // Phase 1: Initial server-side load. We just save the URL, and iso will later fetch it and re-run React
      if (props.location.urlsToFetch)
          props.location.urlsToFetch.push(dataURL)
      // Phase 2: Second server-side load, where our data has been fetched and stored in props.location
      else if (props.location.urlsFetched)
        this.state = { pageData: props.location.urlsFetched[this.pageDataURL(props)] }
      // Phase 3: Initial browser load. Server should have placed our data in window.
      else if (window.jscholApp_initialPageData) {
        this.state = { pageData: window.jscholApp_initialPageData }
        delete window.jscholApp_initialPageData
      }
      // Phase 4: Browser-side page switch. We have to fetch new data ourselves.
      else
        this.fetchState(props)
    }
  }

  // Browser-side AJAX fetch of page data. Sets state when the data is returned to us.
  fetchState(props) {
    let dataURL = this.pageDataURL(props)
    if (dataURL) {
      $.getJSON(this.pageDataURL(props)).done((data) => {
        this.setState({ pageData: data })
      }).fail((jqxhr, textStatus, err)=> {
        this.setState({ error: textStatus + ", " + err })
      })
    }
  }

  // This gets called when props change by switching to a new page.
  // It is *not* called on first-time construction. We use it to fetch page data.
  componentWillReceiveProps(props) {
    this.fetchState(props)
  }

  // Method to be supplied by derived classes, so they can make a URL that will grab
  // the proper API data from the server.
  pageDataURL(props) {
    throw "Derived class must override pageDataURL method"
  }

  render() {
    return (
      <div>
        { this.state.error ? this.renderError() 
          : this.state.pageData ? this.renderData(this.state.pageData) 
          : this.renderLoading() }
        <FooterComp loggedIn={this.state.loggedIn}/>
      </div>
    )
  }

  renderLoading() { return(
    <div>
      <HeaderComp loggedIn={this.state.loggedIn}/>
      <NavComp/>
      <h2 style={{ marginTop: "5em", marginBottom: "5em" }}>Loading...</h2>
    </div>
  )}

  renderError() { return (
    <div>
      <HeaderComp loggedIn={this.state.loggedIn}/>
      <NavComp/>
      <h2 style={{ marginTop: "5em", marginBottom: "5em" }}>{this.state.error}</h2>
    </div>
  )}

}

module.exports = PageBase
