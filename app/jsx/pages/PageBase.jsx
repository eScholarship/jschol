
import React from 'react'
import $ from 'jquery'
import _ from 'lodash'
import { Broadcast, Subscriber } from 'react-broadcast'

import Header1Comp from '../components/Header1Comp.jsx'
import FooterComp from '../components/FooterComp.jsx'

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
    this.setState(state)
  }

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
  }

  // Pages with any editable components should override this.
  isPageEditable() {
    return false
  }

  // Browser-side AJAX fetch of page data. Sets state when the data is returned to us.
  fetchPageData(props) {
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

  // Method to be supplied by derived classes, so they can make a URL that will grab
  // the proper API data from the server.
  renderData() {
    throw "Derived class must override renderData method"
  }

  render() {
    return (
      <Subscriber channel="adminLogin">
        { adminLogin =>
          <Broadcast channel="cms" value={ { isPageEditable: this.isPageEditable(),
                                             isEditingPage: this.state.isEditingPage,
                                             onEditingPageChange: this.onEditingPageChange,
                                             modules: this.state.cmsModules,
                                             adminLogin: adminLogin } }>
            <div>
              { this.state.error ? this.renderError()
                : this.state.pageData ? this.renderData(this.state.pageData)
                : this.renderLoading() }
              <FooterComp/>
            </div>
          </Broadcast>
        }
      </Subscriber>
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
      <h2 style={{ marginTop: "5em", marginBottom: "5em" }}>{this.state.error}</h2>
    </div>
  )}

}

module.exports = PageBase
