// ##### Sidebar Navigation Component ##### //

import React from 'react'
import { Link } from 'react-router'
import $ from 'jquery'

class SidebarNavComp extends React.Component {
  render() {
    return (
      <nav className="c-sidebarnav">
        <ul>
          {this.props.links.map(link => 
            <li key={link.name}><Link to={link.url}>{link.name}</Link></li>)}
        </ul>
      </nav>
    )
  }
}

module.exports = SidebarNavComp;
