
import React from 'react'
import $ from 'jquery'

import Component1 from '../components/component1.jsx'
import Component2 from '../components/component2.jsx'

class UnitPage extends React.Component 
{
  constructor(props) {
    super(props)
    if (props.location.state)
      this.state = props.location.state
    else {
      this.state = null
      $.getJSON("/api/unit/" + props.params.unitID)
        .done((data) => this.setState(data))
    }
  }

  render() { 
    let s = this.state
    if (!s) return null;
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
              <li key={parent_id}><a href={"/unit/"+parent_id}>{parent_id}</a></li>) }
          </ul>
        </div>
        <div>
          Children:
          <ul>
            { s.children.map((child_id) => 
              <li key={child_id}><a href={"/unit/"+child_id}>{child_id}</a></li>) }
          </ul>
        </div>
        { s.items.length==0 ? null :
            <div>
              Items 1-{Math.min(10, s.nItems)} of {s.nItems}:
              <ul>
                { s.items.map((item_id) => 
                  <li key={item_id}><a href={"/item/"+item_id.replace(/^qt/, "")}>{item_id}</a></li>) }
              </ul>
            </div>
        }
      </div>
    )
  }
}

module.exports = UnitPage;
