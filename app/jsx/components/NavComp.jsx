// ##### Global and Local Navigation Component ##### //

import React from 'react'
import Breakpoints from '../../js/breakpoints.json'

// When running in the browser (and only then), include polyfill(s)
if (!(typeof document === "undefined")) {
  require('details-polyfill')
}

class NavComp extends React.Component {
  constructor(props){
    super(props)
  }

  render() {
    return (
      <div>
        { this.props.level && this.renderLocalNav() }
        { !this.props.level && this.renderGlobalNav() }
      </div>
    )
  }

  renderGlobalNav() {
    // ToDo: Bring in campuses
    // var campusSelector = this.props.campuses.map(function(c, i) {
    //   return <a href={"/unit/" + c[0]}>{c[1]}</a>
    // })
    return (
      <nav className="c-globalnav">
        <details open className="c-globalnav__main">
          <summary className="c-globalnav__main-button" role="button">Menu
          </summary>
          <div className="c-globalnav__main-items">
            <a className="c-globalnav__item--active" href="">About</a>
            <details className="c-globalnav__sub">
              <summary className="c-globalnav__sub-button">
                Campuses
              </summary>
              <div className="c-globalnav__sub-items">
              {/* campusSelector */}
              </div>
            </details>
            <a href="">Open Access Policies</a>
            <a href="">Journals</a>
            <a href="">Get Started</a>
          </div>
        </details>
      </nav>
    )
  }

  renderLocalNav() {
    // <nav className="c-globalnav">Unit-specific Nav Placeholder</nav>
    if (this.props.level == "unit") {
      return (
        <nav className="c-globalnav">
          <details open className="c-globalnav__main">
            <summary className="c-globalnav__main-button" role="button">Menu
            </summary>
            <div className="c-globalnav__main-items">
              <a href="">Open Access Policies</a>
              <a href="">Browse Journals</a>
              <a href="">Browse Departments</a>
            </div>
          </details>
        </nav>
      )
    } else {
      return (
        <h3>Unit-specific Nav Placeholder</h3>
      )
    }
  }
}

module.exports = NavComp;
