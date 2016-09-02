
import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import { HeaderComp, GlobalNavComp, FooterComp } from '../components/AllComponents.jsx'

class UnitPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL(props) {
    return "/api/unit/" + props.params.unitID
  }

  render() { return(
    <div>
      <HeaderComp />
      <GlobalNavComp />
      { this.state.pageData ? this.renderData(this.state.pageData) : <div>Loading...</div> }
      <FooterComp />
    </div>
  )}

  renderData(data) { return(
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
  )}
}

module.exports = UnitPage
