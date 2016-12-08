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
    let campusList = p.campusesStats.map(function(c, i) {
        return c['id'] != "" &&
        <p key={i}><a href={"/unit/" + c['id']}>{c['name']}</a><br/>
          &nbsp;&nbsp;&nbsp;&nbsp;<StatNum item={c} /></p>
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

// StatNum displays stats (# publications, # depts, # journals) for a given campus
class StatNum extends React.Component {

  // Returns an array: [any present?, more than one?]
  statNum(x) {
    
    return [ x  ? x.toLocaleString() : null, 
            x>1 ? 's' : '']
  }

  render() {
    let s1 = this.statNum(this.props.item["publications"]),
        s2 = this.statNum(this.props.item["units"]),
        s3 = this.statNum(this.props.item["journals"])
    return (
      <span>
        {s1[0] && <span>{s1[0]} Publication{s1[1]}</span>}
        {s2[0] && <span>, {s2[0]} Unit{s2[1]}</span>}
        {s3[0] && <span>, {s3[0]} Journal{s3[1]}</span>}
      </span>
    )
  }
}

module.exports = BrowsePage
