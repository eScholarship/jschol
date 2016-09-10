
import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import { HeaderComp, GlobalNavComp, FooterComp } from '../components/AllComponents.jsx'

class SearchPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL(props) {
    return "/api/search/" + props.location.search  // plus whatever props.params.YourUrlParam, etc.
  }

  render() { return(
    <div>
      <HeaderComp />
      <GlobalNavComp />
      { this.state.pageData ? this.renderData(this.state.pageData) : <div>Loading...</div> }
      <FooterComp />
    </div>
  )}

  renderData(data) {
    console.log(data);
    return(
    <div>
      {/* Amy hack here */}
      <h2 style={{ marginTop: "5em", marginBottom: "5em" }}>Search page content here</h2>
    </div>
  )}
}

module.exports = SearchPage;
