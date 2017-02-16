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
import SubheaderComp from '../components/SubheaderComp.jsx'
import NavBarComp from '../components/NavBarComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import DepartmentLayout from '../layouts/DepartmentLayout.jsx'
import SeriesLayout from '../layouts/SeriesLayout.jsx'
import JournalLayout from '../layouts/JournalLayout.jsx'

class UnitPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    // console.log(this.props)
    // console.log(this.state)
    // if (this.props.params.pageName) {
    //   if (this.props.params.pageName === 'search') {
    //     return "/api/search/"
    //   } else {
    //     return "/api/unit/" + this.props.params.unitID + "/" + this.props.params.pageName
    //   }
    // } else {
    return "/api/unit/" + this.props.params.unitID + "/home"
    // }
    // return "/api/search/" + this.props.location.search  // plus whatever props.params.YourUrlParam, etc.
  }

  renderData(data) { 
    var contentLayout;
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
    return (
      <div>
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
