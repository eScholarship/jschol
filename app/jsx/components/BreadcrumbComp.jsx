// ##### Breadcrumb Component ##### //

import React from 'react'
import { Link } from 'react-router'

class BreadcrumbComp extends React.Component {
  render() {
    var lastN = this.props.array.length - 1

    var nodes = this.props.array.map(function(node, i) {
      return (
        <Link className={(i==lastN) ? "c-breadcrumb-link--active": null} to={node.url} key={i}>{node.name}</Link>
      )
    });

    return (
      <nav className="c-breadcrumb">
        {nodes}
      </nav>
    )
  }
}

module.exports = BreadcrumbComp;
