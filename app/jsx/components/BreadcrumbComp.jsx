// ##### Breadcrumb Component ##### //

import React from 'react'
import { Link } from 'react-router'

class BreadcrumbComp extends React.Component {
  render() {
    // Items with no unit parent will not display a NavBarComp. Yet, the NavBarComp
    // includes a bottom margin of 20px that gives some vertical breathing room to
    // whatever is below it. So this is a tempoprary style fix until UX can address.
    let missingNavStyle = this.props.array ? null : { margin: '20px 0px 20px' },

        lastN = this.props.array ? this.props.array.length - 1 : 0,
        nodes = this.props.array ? this.props.array.map(function(node, i) {
          return (
            <Link className={(i==lastN) ? "c-breadcrumb-link--active": null} to={node.url} key={i}>{node.name}</Link>
          )
        })
        : 
          <Link to="/">eScholarship</Link>
        ;

    return (
      <nav className="c-breadcrumb" style={missingNavStyle}>
        {nodes}
      </nav>
    )
  }
}

module.exports = BreadcrumbComp;
