// ##### Unit Page ##### //
// this.props = {
//   unitData: {id: , name: , type: , extent: {count: , pub_year: {start: , end: }, about: }}
//   unitHeader: {logo: , nav_bar: , facebook: , twitter: }
//   content: { page content },
//   campusID: ,
//   campusName: ,
//   campuses: [], 
//   breadcrumb: [],
//   appearsIn: ,
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
    return "/api/unit/" + this.props.params.unitID
  }

  renderData(data) { 
    var contentLayout;
    data['carousel'] = true;
    if (data.unitData.type === 'oru') {
      contentLayout = (<DepartmentLayout data={data}/>);
    } else if (data.unitData.type === 'series') {
      contentLayout = (<SeriesLayout data={data}/>);
    } else if (data.unitData.type === 'journal') {
      contentLayout = (<JournalLayout data={data}/>);
    } else {
      contentLayout = (
        <div>
        <h2>Unit {data.unitData.id}</h2>
        <div>
          Info:
          <ul>
            <li>Name: {data.unitData.name}</li>
            <li>Type: {data.unitData.type}</li>
          </ul>
        </div>
        </div>
      );
    }
    return (
      <div>
        <Header2Comp type={data.unitData.type} unitID={data.unitData.id} />
        <SubheaderComp
          type={data.unitData.type}
          unitID={data.unitData.id}
          unitName={data.unitData.name}
          logo={data.unitHeader.logo}
          campusID={data.campusID}
          campusName={data.campusName}
          campuses={data.campuses}/>
        <NavBarComp 
          navBar={data.unitHeader.nav_bar} unitData={data.unitData} socialProps={data.unitHeader.social} />
        <BreadcrumbComp array={data.breadcrumb} />
        {contentLayout}
      </div>
    )
  }

}

module.exports = UnitPage
