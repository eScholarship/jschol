// ##### Home ##### //

import React from 'react'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import FooterComp from '../components/FooterComp.jsx'

class HomePage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    return "/api/home"
  }

  renderData(data) { 
    return(
    <div>
      <Header1Comp />
      <div className="c-navbar">
        <NavComp data={data.header.nav_bar} />
      </div>
      <h2 style={{ marginTop: "5em", marginBottom: "5em" }}>Home page content here</h2>
    </div>
  )}
}

module.exports = HomePage;
