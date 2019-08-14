// ##### Custom Selector Object - Campus ##### //

import React from 'react'

class CustomSelectorCampusObj extends React.Component {
  render() {
    return (
      <div className="o-customselector--campus">
        <div className="o-customselector__heading">
          <a href="">UC Office of the President</a>
        </div>
        <details className="o-customselector__selector">
          <summary aria-label="Select a different item"></summary>
          <div className="o-customselector__menu">
            <div className="o-customselector__sub-heading" id="o-customselector__sub-heading">eScholarship at &hellip;</div>
            <ul className="o-customselector__items">
              <li><a href="">UC Berkeley</a></li>
              <li><a href="">UC Davis</a></li>
              <li><a href="">UC Irvine</a></li>
              <li><a href="">UCLA</a></li>
              <li><a href="">UC Merced</a></li>
              <li><a href="">UC Riverside</a></li>
              <li><a href="">UC San Diego</a></li>
              <li><a href="">UC San Francisco</a></li>
              <li><a href="">UC Santa Barbara</a></li>
              <li><a href="">UC Santa Cruz</a></li>
              <li><a href="">UC Office of the President</a></li>
              <li><a href="">UC Press</a></li>
            </ul>
          </div>
        </details>
      </div>
    )
  }
}

export default CustomSelectorCampusObj;
