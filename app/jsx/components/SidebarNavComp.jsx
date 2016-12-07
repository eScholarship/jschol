// ##### Sidebar Navigation Component ##### //

import React from 'react'

class SidebarNavComp extends React.Component {
  render() {
    return (
      <nav className="c-sidebarnav">
        <ul>
          {this.props.links.map(link => 
            <li><Link to={link.to}>{link.text}</Link></li>
          )}
        </ul>
      </nav>
    )
  }
}

module.exports = SidebarNavComp;
