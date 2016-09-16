
import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import { HeaderComp, NavComp, FooterComp } from '../components/AllComponents.jsx'

class UnitPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL(props) {
    return "/api/unit/" + props.params.unitID
  }

  render() { return(
    <div>
      { this.state.pageData ? this.renderData(this.state.pageData) : <div>Loading...</div> }
      <FooterComp />
    </div>
  )}

  renderData(data) {
    if (data) { return(
    <div>
      {/* ToDo: find parent campus */}
      <HeaderComp level="unit"
                  campus=""
                  unit_id={data.id} />
      <NavComp level="unit"
               campus="" />
      <p dangerouslySetInnerHTML={{__html: data.breadcrumb}}></p>
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
          { data.children.map((child_id) => 
            <li key={child_id}><Link to={"/unit/"+child_id}>{child_id}</Link></li>) }
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
    )} else {return(
      <div>
        {this.state.headerComp}
        {this.state.navComp}
        <h2 style={{ marginTop: "5em", marginBottom: "5em" }}>Error, unit not found.</h2>
      </div>
    )}
  }
}

module.exports = UnitPage
