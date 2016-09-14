// ##### Global and Local Navigation Component ##### //

import React from 'react'

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
