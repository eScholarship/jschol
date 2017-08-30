// ##### Statistics Objects ##### //

import React from 'react'

class StatsObj extends React.Component {
  render() {
    return (
      <div>

        <h2>Statistics Objects Used within Campus Landing Page Carousels</h2>

        <div className="o-stat--item">
          <a href="">24,844</a> Items
        </div>
        <div className="o-stat--view">
          <b>380,941</b> Views
        </div>
        <div className="o-stat--passed">
          <a href="">6,532</a> Items since UC <br/> OA Policy passed
        </div>
        <div className="o-stat--journals">
          <a href="">31</a> eScholarship Journals
        </div>
        <div className="o-stat--units">
          <a href="">119</a> Research Units
        </div>

      </div>
    )
  }
}

module.exports = StatsObj;
