// ##### Breadcrumb Component ##### //

import React from 'react'
import { Link } from 'react-router-dom'

class BreadcrumbComp extends React.Component {
  render() {
    const { array } = this.props
    if (!array || array.length === 0) return null

    const lastN = array.length - 1
    const nodes = array.map((node, i) => (
      <li key={i}>
        <Link 
          className={i === lastN ? "c-breadcrumb-link--active" : null} 
          to={node.url}
          aria-current={i === lastN ? "page" : undefined}
        >
          {node.name}
        </Link>
      </li>
    ))

    return (
      <nav className="c-breadcrumb" aria-label="breadcrumb">
        <ul>{nodes}</ul>
      </nav>
    )
  }
}

export default BreadcrumbComp;
