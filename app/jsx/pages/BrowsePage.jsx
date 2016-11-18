
import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import { HeaderComp, NavComp, BreadcrumbComp } from '../components/AllComponents.jsx'

class BrowsePage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL(props) {
    return "/api/browse/" + props.params.type
  }

  renderData(data) {
    let campusList = data.campuses.map(function(c, i) {
        return c[0] != "" && <p key={i}>{c[1]}</p>
      })
    return(
    <div>
      <HeaderComp />
      <NavComp />
      <BreadcrumbComp array={data.breadcrumb} />
      <h2>Campuses</h2>
      <p>
Lorem ipsum dolor sit amet

consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate,

felis tellus mollis orci, sed start a journal nunc eget odio.
      </p>
      {campusList}
      <br/><br/>
    </div>
  )}

}

module.exports = BrowsePage
