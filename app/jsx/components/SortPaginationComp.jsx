// ##### Sort Pagination Component ##### //

import React from 'react'
import SortComp from '../components/SortComp.jsx'
import PaginationComp from '../components/PaginationComp.jsx'

class SortPaginationComp extends React.Component {
  render() {
    let p = this.props
    return (
      <div className="c-sortpagination">
        <SortComp query={p.query} count={p.count} />
        <input type="hidden" name="start" form="facetForm" value={p.query.start} />
      {(this.props.count > this.props.query.rows) &&
        <PaginationComp query={p.query} count={p.count}/>
      }
      </div>
    )
  }
}

module.exports = SortPaginationComp;
