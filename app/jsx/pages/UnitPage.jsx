// ##### Unit Page ##### //

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
  pageDataURL(props) {
    return "/api/unit/" + props.params.unitID
  }

  renderData(data) { 
    var contentLayout;
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
        <Header2Comp type={data.type} unitID={data.id} />
        <SubheaderComp
          type={data.type}
          unitID={data.id}
          unitName={data.name}
          campusID={data.campusID}
          campusName={data.campusName}
          campuses={data.campuses}/>
        <NavBarComp 
          navBar={data.unitDisplay.nav_bar} unitId={data.unitData.id}/>
        <BreadcrumbComp array={data.breadcrumb} />
        {contentLayout}
      </div>
    )
  }

}

module.exports = UnitPage
