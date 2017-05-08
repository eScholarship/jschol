// ##### Browse Page ##### // 

import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import Header2Comp from '../components/Header2Comp.jsx'
import Subheader2Comp from '../components/Subheader2Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import Breakpoints from '../../js/breakpoints.json'
import WellComp from '../components/WellComp.jsx'
import DescriptionListComp from '../components/DescriptionListComp.jsx'
import ToggleListComp from '../components/ToggleListComp.jsx'

class BrowsePage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    if (this.props.params.campusID) {
      return "/api/browse/depts/" + this.props.params.campusID
    } else {
      // journals or campuses
      return "/api/browse/" + this.props.route.path
    }
  }

  renderData(data) {
    return (
      <div>

      { data.browse_type != "depts" ? 
        // Global browse page (browse_type != "depts")
        <div>
          <Header1Comp />
          <div className="c-navbar">
            <NavComp data={data.header.nav_bar} />
          </div>
        </div>
        :
        // Campus-specific browse page
        <div>
          <Header2Comp type="campus" unitID={data.campusID} />
          <Subheader2Comp unit={data.unit}
                          campusID={data.campusID}
                          campusName={data.campusName}
                          campuses={data.campuses} />
          <div className="c-navbar">
            // ToDo: Properly call header.nav_bar for unit type="campus"
            <NavComp data={[{name: 'Open Access Policies', slug: ''}, {name: 'Journals', slug: '/' + data.campusID + '/journals'}, {name: 'Academic Units', slug: '/' + data.campusID + '/departments'}]} />
          </div>
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
        { p.browse_type == "campuses" && this.renderCampuses(p) }
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
    <section className="o-columnbox1">
      <header>
        <h2>Journals</h2>
      </header>
      <WellComp />
      <div className="c-sort">
        <div className="o-input__droplist1">
          <select name="isActive" id="" onChange={this.changeActive} value={this.state.isActive}>
            <option value="">All</option>
            <option value="1">Actively publishing</option>
            <option value="0">Archived</option>
          </select>
        </div>
        <div className="o-input__droplist1">
          <select name="campusID" id="" onChange={this.changeCampus} value={this.state.campusID}>
            {campusSelector}
          </select>
        </div>
      </div>
      {visibleJournals ? visibleJournals : <p>No journals found matching that criteria<br/><br/><br/></p>}
      <br/><br/>
    </section>
  )}
}

module.exports = BrowsePage
