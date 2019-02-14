// ##### Browse Page ##### // 

import React from 'react'
import { Link } from 'react-router-dom'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import Header2Comp from '../components/Header2Comp.jsx'
import SubheaderComp from '../components/SubheaderComp.jsx'
import NavComp from '../components/NavComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import DescriptionListComp from '../components/DescriptionListComp.jsx'
import ToggleListComp from '../components/ToggleListComp.jsx'
import SidebarComp from '../components/SidebarComp.jsx'
import NotYetLink from '../components/NotYetLink.jsx'
import MetaTagsComp from '../components/MetaTagsComp.jsx'

class BrowsePage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    if (this.props.match.params.campusID) {
      return (this.props.match.path.includes('units')) ?          // URL = /:campusID/units
        "/api/browse/units/" + this.props.match.params.campusID
        :                                                         // URL = /:campusID/journals
         "/api/browse/journals/" + this.props.match.params.campusID
    } else {                                                      // URL = /journals or /campuses
      return "/api/browse/" + this.props.route.path
    }
  }

  pagePermissionsUnit() {
    return this.props.match.params.campusID ? this.props.match.params.campusID : "root"
  }

  renderData(data) {
    return (
      <div>

      { ["campuses", "all_journals"].includes(data.browse_type) ? 
        // Global browse page
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
          <SubheaderComp unit={data.unit} header={data.header} />
          <div className="c-navbar">
            <NavComp data={data.header.nav_bar} />
          </div>
        </div>
      }
      <BreadcrumbComp array={data.breadcrumb} />
      <Content {...data} />
      </div> )
  }
}

class Content extends React.Component {
  render() {
    let p = this.props
    return (
      <div className="c-columns">
        <main id="maincontent">
        {/* Global browse pages */}
        { p.browse_type == "campuses" && <AllCampuses campusesStats={p.campusesStats} otherStats={p.otherStats}/> }
        { p.browse_type == "all_journals" && <AllJournals journals={p.journals}
            archived={p.archived} campuses={p.campuses} /> }
        {/* Campus-specific browse pages */}
        { p.browse_type == "units" && <CampusUnits campus={p.unit} units={p.campusUnits} pageTitle={p.pageTitle} /> }
        { p.browse_type == "journals" && <CampusJournals campus={p.unit}
                                                         journals={p.campusJournals}
                                                         archived={p.campusJournalsArchived}
                                                         pageTitle={p.pageTitle} /> }
        </main>
        <aside>
          <SidebarComp data={this.props.sidebar}/>
        </aside>
      </div>
  )}

}

class AllCampuses extends React.Component {
  render() {
    return (
    <section className="o-columnbox1">
      <MetaTagsComp title="Campuses"/>
      <header>
        <h2>Campuses and Other Locations</h2>
      </header>
      <DescriptionListComp campusesStats={this.props.campusesStats} otherStats={this.props.otherStats} />
    </section>
  )}
}

class AllJournals extends React.Component {
  constructor(props) {
    super(props)
    this.state = {campusID: "",
                  isActive: props.isActive}
    this.changeCampus = this.changeCampus.bind(this)
  }

  componentWillUnmount() {
    this.setState({campusID: ""})
  }

// 'journals' property (JSON)
// i.e. {:id=>"ao4elt4",
//       :name=> "Adaptive Optics ...",
//       :ancestor_unit=>["ucla", "ucsc"],
//       :status=>"active"}
  getVisibleJournals(journals, campusID) {
    let foundOne = false
    let r = journals.map(function(j, i) {
      let p = (campusID =="" || j['ancestor_unit'].includes(campusID)) &&
        <li key={i}><Link to={"/uc/" + j["id"]}>{j["name"]}</Link></li>
      if (p) {foundOne = true}
      return p
    })
    return foundOne ? r : false
  }

  changeCampus(event) {
    this.setState({campusID: event.target.value})
  }

  render() {
    let p = this.props,
      visibleJournals = this.getVisibleJournals(p.journals, this.state.campusID),
      visibleArchived = this.getVisibleJournals(p.archived, this.state.campusID),
      campusSelector = p.campuses.map(function(c, i) {
        return <option key={i} value={c['id']}>{c['name']}</option>
      })
    return (
    <section className="o-columnbox1">
      <MetaTagsComp title="Journals"/>
      <header>
        <h2>Journals</h2>
      </header>
      <div className="o-well-colored">
        Are you a UC-affiliated faculty member, researcher, or student interested in publishing a journal on eScholarship? <a href="https://help.escholarship.org/support/solutions/articles/9000127857-starting-a-new-journal-on-escholarship">Learn more about the journal proposal process</a>.
      </div>
      <div className="o-input__inline">
        <div className="o-input__droplist1">
          <label className="o-input__label--hidden" htmlFor="o-input__droplist-label2">Campus</label>
          <select name="campusID" id="o-input__droplist-label2" onChange={this.changeCampus} value={this.state.campusID}>
            {campusSelector}
          </select>
        </div>
      </div>
    {visibleJournals && 
      <ul className="o-textlist2">{visibleJournals}</ul>
    }
    {visibleArchived &&
      <div>
        <h2>Archived Journals</h2> 
        <ul className="o-textlist2">{visibleArchived}</ul>
      </div>
    }
    {(!(visibleJournals || visibleArchived)) && 
     [<p key="0"><br/></p>, <p key="1">No journals found matching that criteria<br/><br/><br/></p>]
    }
      <br/><br/>
    </section>
  )}
}

class CampusUnits extends React.Component {
  render() {
    return (
    <section className="o-columnbox1">
      <MetaTagsComp title={this.props.pageTitle + " - " + this.props.campus.name}/>
      <header>
        <h2>{this.props.pageTitle}</h2>
      </header>
      <div className="o-well-colored">
        Looking for an academic or research unit that's not listed? <a href="https://help.escholarship.org/support/solutions/articles/9000131086-request-a-new-unit">Learn how to add yours</a>.
      </div>
      <ToggleListComp depts={this.props.units} />
    </section>
  )}
}

class CampusJournals extends React.Component {
  getVisibleJournals(journals) {
    return journals.map(function(j, i) {
      return <li key={i}><Link to={"/uc/" + j["id"]}>{j["name"]}</Link></li>
    })
  }

  render() {
    let p = this.props,
        visibleJournals = (p.journals.length > 0) ? this.getVisibleJournals(p.journals) : null,
        visibleArchived = (p.archived.length > 0) ? this.getVisibleJournals(p.archived) : null
    return (
    <section className="o-columnbox1">
      <MetaTagsComp title={this.props.pageTitle + " - " + this.props.campus.name}/>
      <header>
        <h2>{this.props.pageTitle}</h2>
      </header>
    {visibleJournals && 
      <ul className="o-textlist2">{visibleJournals}</ul>
    }
    {visibleArchived &&
      <div>
        <h2>Archived Journals</h2> 
        <ul className="o-textlist2">{visibleArchived}</ul>
      </div>
    }
    {(!(visibleJournals || visibleArchived)) && 
     [<p key="0"><br/></p>, <p key="1">No journals currently listed.<br/><br/><br/></p>]
    }
    </section>
  )}
}

module.exports = BrowsePage
