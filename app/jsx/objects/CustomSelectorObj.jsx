// ##### Custom Selector Object - Generic ##### //

import React from 'react'

class CustomSelectorObj extends React.Component {
  render() {
    return (
      <div className="o-customselector">
        <div className="o-customselector__heading">Volume 6, Issue 2, 2016</div>
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
    )
  }
}

module.exports = CustomSelectorObj;
