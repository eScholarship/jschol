// ##### Breadcrumb Component ##### //

import React from 'react'

class BreadcrumbComp extends React.Component {
  render() {
    var lastN = this.props.array.length - 1

    var nodes = this.props.array.map(function(node, i) {
      return (
        <a className={(i==lastN) ? "c-breadcrumb-link--active": null} href={node.url} key={i}>{node.name}</a>
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
