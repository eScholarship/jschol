// ##### Custom Selector Objects ##### //

import React from 'react'

class CustomSelectorObj extends React.Component {
  render() {
    return (
      <div>

        <h2>Custom Selector 1</h2>
        <ul>
          <li>Right-aligned heading</li>
          <li>Item group sub-heading</li>
        </ul>

        <div className="o-customselector">
          <a className="o-customselector__heading" href="">UC Office of the President</a>
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

        <h2>Custom Selector 2</h2>
        <ul>
          <li>Left-aligned heading</li>
          <li>No item group sub-heading</li>
        </ul>

        <div className="o-customselector">
          <a className="o-customselector__heading" href="">Volume 6, Issue 2, 2016</a>
          <details className="o-customselector__selector">
            <summary aria-label="Select a different item"></summary>
            <div className="o-customselector__menu">
              <ul className="o-customselector__items">
                <li><a href="">Volume 6, Issue 1, 2016</a></li>
                <li><a href="">Volume 5, Issue 2, 2015</a></li>
                <li><a href="">Volume 5, Issue 1, 2015</a></li>
                <li><a href="">Volume 4, Issue 2, 2014</a></li>
                <li><a href="">Volume 4, Issue 1, 2014</a></li>
                <li><a href="">Volume 3, Issue 2, 2013</a></li>
                <li><a href="">Volume 3, Issue 1, 2013</a></li>
                <li><a href="">Volume 2, Issue 2, 2012</a></li>
                <li><a href="">Volume 2, Issue 1, 2012</a></li>
                <li><a href="">Volume 1, Issue 2, 2011</a></li>
                <li><a href="">Volume 1, Issue 1, 2011</a></li>
              </ul>
            </div>
          </details>
        </div>

      </div>
    )
  }
}

module.exports = CustomSelectorObj;
