// ##### Navigation - Home Component ##### //

import React from 'react'
import { Link } from 'react-router'
import Breakpoints from '../../js/breakpoints.json'

// When running in the browser (and only then), include polyfill(s)
if (!(typeof document === "undefined")) {
  require('details-polyfill')
}

class Nav1Comp extends React.Component {
  state = { isOpen: true } // must init to something in case of server-side rendering

  componentWillMount() {
    if (typeof matchMedia != "undefined") {
      this.mq = matchMedia("(min-width:"+Breakpoints.screen2+")")
      this.mq.addListener(this.widthChange)
      this.widthChange()
    }
  }

  campusListGenerator(props) {
    if (props.campuses) { return (
        <div className="c-nav1__sub-items">
          {this.props.campuses.map((c, i) => {
            return c['id'] != "" && <Link key={i} to={"/unit/" + c['id']}>{c['name']}</Link>
          })}
        </div>
    )}
    // Temporary
    // ToDo: Need to work on global state UI for campus list. Sticking this in here in the meantime.
    return (
      <div className="c-nav1__sub-items">
        <Link to="/unit/ucb">UC Berkeley</Link>
        <Link to="/unit/ucd">UC Davis</Link>
        <Link to="/unit/uci">UC Irvine</Link>
        <Link to="/unit/ucla">UCLA</Link>
        <Link to="/unit/ucm">UC Merced</Link>
        <Link to="/unit/ucr">UC Riverside</Link>
        <Link to="/unit/ucsd">UC San Diego</Link>
        <Link to="/unit/ucsf">UC San Francisco</Link>
        <Link to="/unit/ucsb">UC Santa Barbara</Link>
        <Link to="/unit/ucsc">UC Santa Cruz</Link>
        <Link to="/unit/ucop">UC Office of the President</Link>
        <Link to="/unit/ucpress">UC Press</Link>
      </div>
    )
  }

  widthChange = ()=> {
    this.setState({isOpen: this.mq.matches})
  }

  render() {
    return (
      <nav className="c-nav1">
        <details open={this.state.isOpen ? "open" : ""} className="c-nav1__main">
          <summary className="c-nav1__main-button" role="button">Menu
          </summary>
          <div className="c-nav1__main-items">
            <details className="c-nav1__sub">
              <summary className="c-nav1__sub-button">
                Campus Sites
              </summary>
              {this.campusListGenerator(this.props)}
            </details>
            {/* ToDo: Link */}
            <Link className="c-nav1__item" to="">UC Open Access Policies</Link>
            {/* ToDo: Link */}
            <Link to="">eScholarship Publishing</Link>
          </div>
        </details>
      </nav>
    )
  }
}

module.exports = Nav1Comp;
