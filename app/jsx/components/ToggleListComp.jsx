// ##### Toggle List Component ##### //

import React from 'react'
import { Link } from 'react-router'
import ToggleListSubComp from '../components/ToggleListSubComp.jsx'

class ToggleListComp extends React.Component {
  constructor(props){
    super(props)
    this.state = {override: {open: false, date: new Date()}}
  }
  render() {
    return (
      <div className="c-togglelist">
        <div className="c-togglelist__buttons">
          <button className="o-button__2" onClick = {()=> this.setState({override: {open: true, date: new Date()}})}>Expand All</button>
          <button className="o-button__2" onClick = {()=> this.setState({override: {open: false, date: new Date()}})}>Collapse All</button>
        </div>
        <ul className="c-togglelist__mainlist">
        { this.props.depts.map((node) => 
            node.children ?
              <li key={node.id}>
                <Link to={"/unit/" + node.id}>
                  {node.name}</Link>
                <ToggleListSubComp override={this.state.override}>{node.children}</ToggleListSubComp></li>
             : 
              <li key={node.id}>
                <Link to={"/unit/" + node.id}>
                  {node.name}</Link></li> )}
        </ul>
      </div>
    )
  }
}

module.exports = ToggleListComp;
