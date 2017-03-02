// ##### Breadcrumb Component ##### //

import React from 'react'
import { Link } from 'react-router'

class BreadcrumbComp extends React.Component {
  render() {
    let missingNavStyle = this.props.array ? null : { margin: '20px 0px 20px' },
        lastN = this.props.array ? this.props.array.length - 1 : 0,
        nodes = this.props.array ? this.props.array.map(function(node, i) {
          if (node.id == 'root') {
            return (
              <Link className={(i==lastN) ? "c-breadcrumb-link--active": null} to="/" key={i}>{node.name}</Link>
            )
          }
          return (
            <Link className={(i==lastN) ? "c-breadcrumb-link--active": null} to={"/unit/" + node.id} key={i}>{node.name}</Link>
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
