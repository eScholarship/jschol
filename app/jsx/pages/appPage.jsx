
import React from 'react'
import $ from 'jquery'

class AppPage extends React.Component
{
  constructor(props) {
    super(props)
    this.state = { pageData: null }
    if (props.location.urlsToFetch)
      props.location.urlsToFetch.push(this.pageDataURL(props))
    else if (props.location.urlsFetched)
      this.state = { pageData: props.location.urlsFetched[this.pageDataURL(props)] }
    else if (window.jscholApp_initialPageData)
      this.state = { pageData: window.jscholApp_initialPageData }
    else
      this.fetchState(props)
  }

  fetchState(props) {
    $.getJSON(this.pageDataURL(props)).done((data) => {
      this.setState({ pageData: data })
    })
  }

  // This gets called when props change by switching to a new unit page. 
  // It is *not* called on first-time construction.
  componentWillReceiveProps(props) {
    this.fetchState(props)
  }

  pageDataURL(props) {
    throw "Derived class must override pageDataURL method"
  }
}

module.exports = AppPage