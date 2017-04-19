// ##### Sort Pagination Component ##### //

import React from 'react'
import SortComp from '../components/SortComp.jsx'
import PaginationComp from '../components/PaginationComp.jsx'

class SortPaginationComp extends React.Component {
  render() {
    return (
      <div className="c-sortpagination">
        <SortComp />
        <PaginationComp />
      </div>
    )
  }
}

module.exports = SortPaginationComp;
