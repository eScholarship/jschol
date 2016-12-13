// ##### Filter Component ##### //

import React from 'react'

class FilterComp extends React.Component {
  render() {
    return (
      <form action="" className="c-filter">
        <h2 className="c-filter__heading">Your Search: “Open Access”</h2>
        <div>Results: 12 pages, 12,023 works</div>
        <div className="c-filter__active-header">
          <span id="c-filter__active-title">Active filters:</span>
          <button>clear all</button>
        </div>
        <div role="group" aria-labelledby="c-filter__active-title" className="c-filter__active">
          <button>Type of work (Articles)</button>
          <button>Publication Year (All)</button>
          <button>Campus (UC Berkeley)</button>
        </div>
        <a href="" className="c-filter__tips">search tips</a>
      </form>
    )
  }
}

module.exports = FilterComp;
