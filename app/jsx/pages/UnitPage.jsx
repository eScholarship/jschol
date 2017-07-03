// ##### Unit Page ##### //
// this.props = {
//   unit: {id: , name: , type: , status }}
//   header: {breadcrumb: [], campusID: , campusName: , campuses: [], logo: , nav_bar: [], social: }
//   content: { page content },
//   marquee: {about: , carousel: , extent: }
//   sidebar: []
// }

import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import Header2Comp from '../components/Header2Comp.jsx'
import SubheaderComp from '../components/SubheaderComp.jsx'
import NavBarComp from '../components/NavBarComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import CampusLayout from '../layouts/CampusLayout.jsx'
import DepartmentLayout from '../layouts/DepartmentLayout.jsx'
import SeriesLayout from '../layouts/SeriesLayout.jsx'
import JournalLayout from '../layouts/JournalLayout.jsx'
import UnitSearchLayout from '../layouts/UnitSearchLayout.jsx'
import UnitStaticPageLayout from '../layouts/UnitStaticPageLayout.jsx'
import UnitProfileLayout from '../layouts/UnitProfileLayout.jsx'
import UnitSidebarConfigLayout from '../layouts/UnitSidebarConfigLayout.jsx'
import UnitNavConfigLayout from '../layouts/UnitNavConfigLayout.jsx'
import AdminBarComp from '../components/AdminBarComp.jsx'

class UnitPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  // will likely at some point want to move these (search, home, pages) to different extensions of PageBase,
  // as all kinds of CMS-y stuff will live here, though perhaps not, to capitalize on React's
  // diff-ing of pages - all these different pages have quite a few of the same components:
  // header, footer, nav, sidebar. 
  
  // [********** AW - 3/15/17 **********]
  // TODO [UNIT-CONTENT-AJAX-ISSUE]: need to separate these into different PageBase extensions
  // React tries to render different content components 
  // (ie - switch between DeparmentLayout and Series Layout or UnitSearchLayout)
  // before the AJAX call for the different content has returned and then there are lots of issues!
  pageDataURL() {
    const pm = this.props.params
    if (pm.pageName) {
      if (pm.pageName === 'search')
        return "/api/unit/" + pm.unitID + "/search/" + this.props.location.search
      else if (pm.pageName == "nav")
        return "/api/unit/" + pm.unitID + "/nav/" + pm.splat
      else
        return "/api/unit/" + pm.unitID + "/" + pm.pageName
    }
    return "/api/unit/" + pm.unitID + "/home"
  }

  // Unit ID for permissions checking
  pagePermissionsUnit() {
    return this.props.params.unitID
  }

  renderSidebar = sidebarData =>
    sidebarData.map(sb =>
      <section key={sb.id} className="o-columnbox1">
        <header>
          <h2>{sb.title ? sb.title : sb.kind.replace(/([a-z])([A-Z][a-z])/g, "$1 $2")}</h2>
        </header>
        <p>
          Optio distinctio nemo numquam dolorem rerum quae eum, ipsum amet repudiandae,
          cum a quibusdam magnam praesentium nostrum quidem eaque maiores ipsam. Iste voluptate
          similique sapiente totam sit, minus numquam enim?
        </p>
      </section>)

  cmsPage(data, page) {
    if (this.state.adminLogin && !this.state.fetchingPerms && !this.state.isEditingPage) {
      console.log("Editing turned off; redirecting to unit page.")
      setTimeout(()=>this.props.router.push(`/uc/${data.unit.id}`), 0)
    }
    else
      return page
  }

  // [********** AMY NOTES 3/15/17 **********]
  // TODO: each of the content layouts currently include the sidebars, 
  // but this should get stripped out and handled here in UnitPage
  // TODO [UNIT-CONTENT-AJAX-ISSUE]: handle the AJAX issue described above pageDataURL method definition
  renderData(data) { 
    let sidebar = this.renderSidebar(data.sidebar)
    let contentLayout
    if (this.state.fetchingData)
      contentLayout = (<h2 style={{ marginTop: "5em", marginBottom: "5em" }}>Loading...</h2>)
    else if (this.props.params.pageName === 'search') {
      contentLayout = (<UnitSearchLayout unit={data.unit} data={data.content} sidebar={sidebar}/>)
    } else if (this.props.params.pageName === 'profile') {
      contentLayout = this.cmsPage(data, <UnitProfileLayout unit={data.unit} data={data.content}/>)
    } else if (this.props.params.pageName === 'nav') {
      contentLayout = this.cmsPage(data, <UnitNavConfigLayout unit={data.unit} data={data.content} sendApiData={this.sendApiData}/>)
    } else if (this.props.params.pageName === 'sidebar') {
      contentLayout = this.cmsPage(data, <UnitSidebarConfigLayout unit={data.unit} data={data.content} sendApiData={this.sendApiData}/>)
    } else if (this.props.params.pageName) {
      contentLayout = (<UnitStaticPageLayout unit={data.unit} data={data.content} sidebar={sidebar} fetchPageData={this.fetchPageData}/>)
    } else {
      data.marquee.carousel = true
      if (data.unit.type === 'oru') {
        contentLayout = (<DepartmentLayout unit={data.unit} data={data.content} sidebar={sidebar} marquee={data.marquee}/>)
      } else if (data.unit.type == 'campus') {
        contentLayout = (<CampusLayout unit={data.unit} data={data.content} sidebar={sidebar}/>)
      } else if (data.unit.type.includes('series')) {
        contentLayout = (<SeriesLayout unit={data.unit} data={data.content} sidebar={sidebar} marquee={data.marquee}/>)
      } else if (data.unit.type === 'journal') {
        contentLayout = (<JournalLayout unit={data.unit} data={data.content} sidebar={sidebar} marquee={data.marquee}/>)
      } else {
        contentLayout = (
          <div>
          <h2>Unit {data.unit.id}</h2>
          <div>
            Info:
            <ul>
              <li>Name: {data.unit.name}</li>
              <li>Type: {data.unit.type}</li>
            </ul>
          </div>
          </div>
        )
      }
    }
    return (
      <div>
        <AdminBarComp/>
        <Header2Comp type={data.unit.type} unitID={data.unit.id} />
        <SubheaderComp unit={data.unit} logo={data.header.logo} 
          campusID={data.header.campusID}
          campusName={data.header.campusName}
          campuses={data.header.campuses}/>
        <NavBarComp 
          navBar={data.header.nav_bar} unit={data.unit} socialProps={data.header.social} />
        <BreadcrumbComp array={data.header.breadcrumb} />
        {contentLayout}
      </div>
    )
  }

}

module.exports = UnitPage
