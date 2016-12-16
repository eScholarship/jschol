// ##### Navigation - Campus Component ##### //

import React from 'react'
import Breakpoints from '../../js/breakpoints.json'

class Nav2Comp extends React.Component {
  state = { isOpen: true } // must init to something in case of server-side rendering
  componentWillMount() {
    if (typeof matchMedia != "undefined") {
      this.mq = matchMedia("(min-width:"+Breakpoints.screen3+")")
      this.mq.addListener(this.widthChange)
      this.widthChange()
    }
  }
  widthChange = ()=> {
    this.setState({isOpen: this.mq.matches})
  }
  render() {
    return (
      <nav className="c-nav2">
        <details open={this.state.isOpen ? "open" : ""} className="c-nav2__main">
          <summary className="c-nav2__main-button" role="button">Menu
          </summary>
          <div className="c-nav2__main-items">
            <a href="">Open Access Policies</a>
            <a href="">Browse Journals</a>
            <a href="">Browse Departments</a>
          </div>
        </details>
      </nav>
    )
  }
}

module.exports = Nav2Comp;
