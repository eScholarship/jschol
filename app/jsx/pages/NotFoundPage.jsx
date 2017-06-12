import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import Nav1Comp from '../components/Nav1Comp.jsx'
import FooterComp from '../components/FooterComp.jsx'

class NotFoundPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    return null
  }

  renderContent() { return (
    <div>
      <Header1Comp />
      <Nav1Comp />
      <br/>
      <h2>Error: Page not found.</h2>
      <br/>
      <FooterComp />
    </div>
  )}

}

module.exports = NotFoundPage
