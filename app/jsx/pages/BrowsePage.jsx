
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
    let p = data
    return (
    <div>
      <HeaderComp />
      <NavComp />
      <BreadcrumbComp array={p.breadcrumb} />
      <Content
        {...p}
      />
    </div>
  )}

}

class Content extends React.Component {
  render() {
    let p = this.props
    return (
    <div>
      { p.type == "campuslist" && this.renderCampuses(p) }
      { p.type == "depts" && this.renderDepts(p) }
      { p.type == "journals" && this.renderJournals(p) }
    </div>
  )}

  renderCampuses(p) {
    let campusList = p.campuses.map(function(c, i) {
        return c['id'] != "" && <p key={i}><a href={"/unit/" + c['id']}>{c['name']}</a></p>
      })
    return (
    <div>
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

  renderJournals(p) {
    let journalList = p.journals.map(function(j, i) {
        return <p key={i}><a href={"/unit/" + j["id"]}>{j["name"]}</a></p>
      })
    return (
    <div>
      <h2>Journals</h2>
      <p>
Lorem ipsum dolor sit amet

consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate,

felis tellus mollis orci, sed start a journal nunc eget odio.
      </p>
      {journalList}
      <br/><br/>
    </div>
  )}
}

module.exports = BrowsePage
