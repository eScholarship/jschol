// ##### Campus Heading and Menu Component ##### //

import React from 'react'

class CampusSelectorComp extends React.Component {
  render() {
    return (
      <div className="c-campusselector">
        <h2 className="c-campusselector__heading">
          <a href="">UC Office of the President</a>
        </h2>
        <details className="c-campusselector__selector">
          <summary></summary>
          <div className="c-campusselector__selector-items">
            <div>eScholarship at &hellip;</div>
            <a href="">UC Berkeley</a>
            <a href="">UC Davis</a>
            <a href="">UC Irvine</a>
            <a href="">UCLA</a>
            <a href="">UC Merced</a>
            <a href="">UC Riverside</a>
            <a href="">UC San Diego</a>
            <a href="">UC San Francisco</a>
            <a href="">UC Santa Barbara</a>
            <a href="">UC Santa Cruz</a>
            <a href="">UC Office of the President</a>
            <a href="">UC Press</a>
          </div>
        </details>
      </div>
    )
  }
}

module.exports = CampusSelectorComp;
