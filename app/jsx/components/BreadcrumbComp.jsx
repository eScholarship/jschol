// ##### Breadcrumb Component ##### //

import React from 'react'
import { Link } from 'react-router-dom'

const BreadcrumbComp = ({ array }) => {
  if (!array?.length) return null

  const lastN = array.length - 1

  return (
    <nav className="c-breadcrumb" aria-label="breadcrumb">
      <ul>
        {array.map((node, i) => (
          <li key={i}>
            <Link
              className={i === lastN ? "c-breadcrumb-link--active" : null}
              to={node.url}
              aria-current={i === lastN ? "page" : undefined}
            >
              {node.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default BreadcrumbComp
