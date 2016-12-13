import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import HeaderComp from '../components/HeaderComp.jsx'
import FooterComp from '../components/FooterComp.jsx'
import NavComp from '../components/NavComp.jsx'

class NotFoundPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL(props) {
    return "/api/browse/" + props.params.type
  }

  render() {
    return (
    <div>
      <HeaderComp />
      <NavComp />
      <br/>
      <h2>Error: Page not found.</h2>
      <br/>
      <FooterComp />
    </div>
  )}

}

module.exports = NotFoundPage
