
import React from 'react'
import { Link } from 'react-router'
import $ from 'jquery'

import Component1 from '../components/component1.jsx'
import Component2 from '../components/component2.jsx'

function flexibleGetJSON(props, url, callback)
{
  if (typeof(props.location.urlsToFetch) == "object") {
    console.log("Saving URL to fetch later")
    props.location.urlsToFetch.push(url)
  }
  else {
    console.log("Doing jquery getJSON")
    $.getJSON(url).done(callback)
  }
}

class UnitPage extends React.Component 
{
  constructor(props) {
    super(props)
    this.state = { unitState: null }
    this.refresh(props)
  }

  // This gets called when props change by switching to a new unit page. 
  // It is *not* called on first-time construction.
  componentWillReceiveProps(props) {
    this.refresh(props)
  }

  refresh(props) {
    // TODO: display "wait" cursor while loading
    flexibleGetJSON(props, "/api/unit/" + props.params.unitID, (data) => this.setState({ unitState: data }))
  }

  render() { 
    let s = this.state.unitState
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

//UnitPage.contextTypes = {
//    router: React.PropTypes.func.isRequired
//};

module.exports = UnitPage;
