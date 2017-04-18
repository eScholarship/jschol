// ##### Unit Page ##### //
// this.props = {
//   unit: {id: , name: , type: , is_active }}
//   header: {breadcrumb: [], campusID: , campusName: , campuses: [], logo: , nav_bar: [], social: }
//   content: { page content },
//   marquee: {about: , carousel: , extent: }
//   sidebar: []
// }

import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import Header2Comp from '../components/Header2Comp.jsx'
import Subheader2Comp from '../components/Subheader2Comp.jsx'
import NavBarComp from '../components/NavBarComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import DepartmentLayout from '../layouts/DepartmentLayout.jsx'
import SeriesLayout from '../layouts/SeriesLayout.jsx'
import JournalLayout from '../layouts/JournalLayout.jsx'
import UnitSearchLayout from '../layouts/UnitSearchLayout.jsx'

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
    if (this.props.params.pageName) {
      if (this.props.params.pageName === 'search') {
        return "/api/unit/" + this.props.params.unitID + "/search/" + this.props.location.search
      } else {
        return "/api/unit/" + this.props.params.unitID + "/" + this.props.params.pageName
      }
    }
    return "/api/unit/" + this.props.params.unitID + "/home"
  }
  
  // [********** AMY NOTES 3/15/17 **********]
  // TODO: each of the content layouts currently include the sidebars, 
  // but this should get stripped out and handled here in UnitPage
  // TODO [UNIT-CONTENT-AJAX-ISSUE]: handle the AJAX issue described above pageDataURL method definition
  renderData(data) { 
    var contentLayout;
    if (this.props.params.pageName === 'search') {
      contentLayout = (<UnitSearchLayout unit={data.unit} data={data.content}/>);
    } else {
      data.marquee.carousel = true;
      if (data.unit.type === 'oru') {
        contentLayout = (<DepartmentLayout unit={data.unit} data={data.content} marquee={data.marquee}/>);
      } else if (data.unit.type === 'series') {
        contentLayout = (<SeriesLayout unit={data.unit} data={data.content} marquee={data.marquee}/>);
      } else if (data.unit.type === 'journal') {
        contentLayout = (<JournalLayout unit={data.unit} data={data.content} marquee={data.marquee}/>);
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
        );
      }
    }
    return (
      <div>
        <Header2Comp type={data.unit.type} unitID={data.unit.id} />
        <Subheader2Comp unit={data.unit} logo={data.header.logo} 
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
