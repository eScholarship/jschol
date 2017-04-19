// ##### Browse Page ##### // 

import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import Header2Comp from '../components/Header2Comp.jsx'
import Subheader2Comp from '../components/Subheader2Comp.jsx'
import Nav1Comp from '../components/Nav1Comp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import Breakpoints from '../../js/breakpoints.json'
import WellComp from '../components/WellComp.jsx'
import DescriptionListComp from '../components/DescriptionListComp.jsx'
import ToggleListComp from '../components/ToggleListComp.jsx'

class BrowsePage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    if (this.props.params.browse_type) {
      return "/api/browse/" + this.props.params.browse_type
    } else {
      return "/api/browse/depts/" + this.props.params.campusID
    }
  }

  renderData(data) {
    return (
      <div>
        <a href="#maincontent" className="c-skipnav">Skip to main content</a>

      {/* Campus-specific browse page */}
      { data.browse_type == "depts" &&
        <div>
          <Header2Comp type="campus" unitID={data.campusID} />
          <Subheader2Comp type="campus"
                          campuses={data.campuses}
                          unitID={data.campusID}
                          unitName={data.campusName}
                          campusID={data.campusID}
                          campusName={data.campusName} />
        </div>
      }
      {/* Global browse page */}
      { data.browse_type != "depts" &&
        <div>
          <Header1Comp />
          <Nav1Comp campuses={data.campuses} />
        </div>
      }
      <BreadcrumbComp array={data.breadcrumb} />
      <Content
        {...data}
      />
      </div> )
  }
}

class Content extends React.Component {
  render() {
    let p = this.props
    return (
      <div className="c-columns">
        <main id="maincontent">
        { p.browse_type == "campuslist" && this.renderCampuses(p) }
        { p.browse_type == "depts" && this.renderDepts(p.depts) }
        { p.browse_type == "journals" && <BrowseJournals journals={p.journals}
          isActive="" campuses={p.campuses} campusID=""/> }
        </main>
        <aside>
          <section className="o-columnbox1">
            <header>
              <h2>Featured Journals</h2>
            </header>
            <p>[content to go here]</p>
          </section>
        </aside>
      </div>
  )}

  renderCampuses(p) {
    return (
    <section className="o-columnbox1">
      <header>
        <h2>Campuses</h2>
      </header>
      <WellComp />
      <DescriptionListComp campusesStats={p.campusesStats} />
    </section>
  )}

  renderDepts(depts) {
    return (
    <section className="o-columnbox1">
      <header>
        <h2>Academic Units</h2>
      </header>
      <WellComp />
      <ToggleListComp depts={depts} />
    </section>
  )}
}

class BrowseJournals extends React.Component {
  constructor(props) {
    super(props)
    this.state = {campusID: props.campusID,
                  isActive: props.isActive}
    this.changeCampus = this.changeCampus.bind(this)
    this.changeActive = this.changeActive.bind(this)
  }

// 'journals' property (JSON)
// i.e. {:id=>"ao4elt4",
//       :name=> "Adaptive Optics ...",
//       :ancestor_unit=>["ucla", "ucsc"],
//       :is_active=>true}
  getVisibleJournals(journals, isActive, campusID) {
    let foundOne = false
    let r = journals.map(function(j, i) {
      let p = (j['is_active'] == isActive || isActive == "") &&
        (j['ancestor_unit'].includes(campusID) || campusID =="") &&
        <p key={i}><a href={"/unit/" + j["id"]}>{j["name"]}</a></p>
      if (p) {foundOne = true}
      return p
    })
    return foundOne ? r : false
  }

  changeCampus(event) {
    this.setState({campusID: event.target.value})
  }

  changeActive(event) {
    this.setState({isActive: event.target.value})
  }

  render() {
    let p = this.props,
      visibleJournals = this.getVisibleJournals(p.journals, this.state.isActive, this.state.campusID),
      campusSelector = p.campuses.map(function(c, i) {
        return <option key={i} value={c['id']}>{c['name']}</option>
      })
    return (
    <div>
      <h2>Journals</h2>
      <p>
Lorem ipsum dolor sit amet

consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate,

felis tellus mollis orci, sed start a journal nunc eget odio.
      </p>
      <div className="o-input__droplist">
        <select name="isActive" id="" onChange={this.changeActive} value={this.state.isActive}>
          <option value="">All</option>
          <option value="1">Actively publishing</option>
          <option value="0">Archived</option>
        </select>
      </div>
      <div className="o-input__droplist">
        <select name="campusID" id="" onChange={this.changeCampus} value={this.state.campusID}>
          {campusSelector}
        </select>
      </div>
      {visibleJournals ? visibleJournals : <p>No journals found matching that criteria<br/><br/><br/></p>}
      <br/><br/>
    </div>
  )}
}

module.exports = BrowsePage
