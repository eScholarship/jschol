// ##### Statistics Objects ##### //

import React from 'react'

class StatsObj extends React.Component {
  render() {
    return (
      <div>

        <h2>Statistics Objects Used within Campus Landing Page Carousels</h2>

        <div className="o-stat--item">
          <b>24,844</b> Items
        </div>
        <div className="o-stat--view">
          <b>380,941</b> Views
        </div>
        <div className="o-stat--passed">
          <b>6,532</b> Items since UC OA Policy passed
        </div>
        <div className="o-stat--journals">
          <b>31</b> eScholarship Journals
        </div>
        <div className="o-stat--units">
          <b>119</b> Research Units
        </div>

      </div>
    )
  }
}

module.exports = StatsObj;
