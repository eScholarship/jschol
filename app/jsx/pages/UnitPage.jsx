// ##### Unit Page ##### //

import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import Header2Comp from '../components/Header2Comp.jsx'
import Subheader1Comp from '../components/Subheader1Comp.jsx'
import Subheader2Comp from '../components/Subheader2Comp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import DepartmentLayout from '../layouts/DepartmentLayout.jsx'
import SeriesLayout from '../layouts/SeriesLayout.jsx'

class UnitPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL(props) {
    return "/api/unit/" + props.params.unitID
  }

  renderData(data) { 
    var contentLayout;
    if (data.type === 'oru') {
      contentLayout = (<DepartmentLayout data={data}/>);
    } else if (data.type === 'series') {
      contentLayout = (<SeriesLayout data={data}/>);
    } else {
      contentLayout = (
        <div>
        <h2>Unit {data.id}</h2>
        <div>
          Info:
          <ul>
            <li>Name: {data.name}</li>
            <li>Type: {data.type}</li>
          </ul>
        </div>
        <div>
          Parents:
          <ul>
            { data.parents.map((parent_id) => 
              <li key={parent_id}><Link to={"/unit/"+parent_id}>{parent_id}</Link></li>) }
          </ul>
        </div>
        <div>
          Children:
          <ul>
            { data.children.map((child) => 
              <li key={child.unit_id}><Link to={"/unit/"+child.unit_id}>{child.name}</Link></li>) }
          </ul>
        </div>
        { data.items.length==0 ? null :
          <div>
            Items 1-{Math.min(10, data.nItems)} of {data.nItems}:
            <ul>
              { data.items.map((item_id) =>
                <li key={item_id}><Link to={"/item/"+item_id.replace(/^qt/, "")}>{item_id}</Link></li>) }
            </ul>
          </div>
        }
        </div>
      );
    }

    return (
      <div>
        <Header2Comp type={data.type} unitID={data.id} />
        <Subheader1Comp
          type={data.type}
          unitID={data.id}
          unitName={data.name}
          campusID={data.campusID}
          campusName={data.campusName}
          campuses={data.campuses}/>
        <BreadcrumbComp array={data.breadcrumb} />
        {contentLayout}
      </div>
    )
  }

}

module.exports = UnitPage
