// ##### Home ##### //

import React from 'react'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import Nav1Comp from '../components/Nav1Comp.jsx'
import FooterComp from '../components/FooterComp.jsx'

class HomePage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL(props) {
    return "/api/home"
  }

  renderData(data) { 
    return(
    <div>
      <Header1Comp />
      <Nav1Comp campuses={data.campuses} />
      <h2 style={{ marginTop: "5em", marginBottom: "5em" }}>Home page content here</h2>
    </div>
  )}
}

module.exports = HomePage;
