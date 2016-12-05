
import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import { HeaderComp, NavComp, BreadcrumbComp } from '../components/AllComponents.jsx'

class StaticPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL(props) {
    return "/api/static/" + props.params.unitID + "/" + props.params.pageName
  }

  renderData(data) {
    let p = data
    return (
    <div>
      <HeaderComp />
      <NavComp />
      <BreadcrumbComp array={p.breadcrumb} />
      <div>
      This is that
      </div>
    </div>
  )}

}

module.exports = StaticPage;
