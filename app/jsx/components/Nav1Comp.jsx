// ##### Navigation - Home Component ##### //

import React from 'react'
import { Link } from 'react-router'
import Breakpoints from '../../js/breakpoints.json'

class Nav1Comp extends React.Component {
  state = { isOpen: true } // must init to something in case of server-side rendering

  componentWillMount() {
    if (typeof matchMedia != "undefined") {
      this.mq = matchMedia("(min-width:"+Breakpoints.screen2+")")
      this.mq.addListener(this.widthChange)
      this.widthChange()
    }
    this.campusSelector = this.props.campuses.map(function(c, i) {
        return c['id'] != "" && <Link key={i} to={"/unit/" + c['id']}>{c['name']}</Link>
      })
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
              <div className="c-nav1__sub-items">
                {this.campusSelector}
              </div>
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
