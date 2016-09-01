
import React from 'react'
import { Link } from 'react-router'

import AppPage from './appPage.jsx'
import Component1 from '../components/component1.jsx'
import Component2 from '../components/component2.jsx'

class UnitPage extends AppPage 
{
  pageDataURL(props) {
    return "/api/unit/" + props.params.unitID
  }

  render() {
    let s = this.state.pageData
    if (!s) return <div>Loading...</div>;
    return(
      <div>
        <h2>Unit {s.id}</h2>
        <div>
          Info:
          <ul>
            <li>Name: {s.name}</li>
            <li>Type: {s.type}</li>
          </ul>
        </div>
        <div>
          Parents:
          <ul>
            { s.parents.map((parent_id) => 
              <li key={parent_id}><Link to={"/unit/"+parent_id}>{parent_id}</Link></li>) }
          </ul>
        </div>
        <div>
          Children:
          <ul>
            { s.children.map((child_id) => 
              <li key={child_id}><Link to={"/unit/"+child_id}>{child_id}</Link></li>) }
          </ul>
        </div>
        { s.items.length==0 ? null :
            <div>
              Items 1-{Math.min(10, s.nItems)} of {s.nItems}:
              <ul>
                { s.items.map((item_id) => 
                  <li key={item_id}><Link to={"/item/"+item_id.replace(/^qt/, "")}>{item_id}</Link></li>) }
              </ul>
            </div>
        }
      </div>
    )
  }
}

module.exports = UnitPage
