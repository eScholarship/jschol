// ##### Navigation - Journal Component ##### //

import React from 'react'

class Nav3Comp extends React.Component {
  constructor(props){
    super(props)
    this.state = {submenuActive: false}
  }
  render() {
    return (
      <nav className="c-nav3">
        <details className="c-nav3__main">
          <summary className="c-nav3__main-button" role="button">Menu
          </summary>
          <div className={this.state.submenuActive ? "c-nav3__main-items--submenu-active" : "c-nav3__main-items"}>
            <a href="">Journal Home</a>
            <details className="c-nav3__sub" ref={(domNode)=> this.nav3__sub = domNode}>
              <summary className="c-nav3__sub-button" onClick = {(event)=> this.setState({submenuActive: !this.nav3__sub.open})}>
                Issues
              </summary>
              <div className="c-nav3__sub-items">
                <button className="c-nav3__sub-items-button" aria-label="return to menu" onClick = {()=> { this.setState({submenuActive: false}); this.nav3__sub.open = false; }}>Main Menu</button>
                <a href="">Volume 41, Issue 1</a>
                <a href="">Volume 40, Issue 1</a>
                <a href="">Volume 39, Issue 1</a>
                <a href="">Volume 38, Issue 1</a>
                <a href="">Volume 37, Issue 1</a>
                <a href="">Volume 36, Issue 1</a>
                <a href="">Volume 35, Issue 1</a>
                <a href="">Volume 34, Issue 1</a>
                <a href="">Volume 33, Issue 1</a>
                <a href="">Volume 32, Issue 1</a>
                <a href="">Volume 31, Issue 1</a>
                <a href="">Volume 30, Issue 1</a>
              </div>
            </details>
            <a href="">About Us</a>
            <a href="">Aims &amp; Scope</a>
            <a href="">Editorial Board</a>
            <a href="">Policies</a>
            <a href="">Submission Guidelines</a>
            <a href="">Contact</a>
          </div>
        </details>
      </nav>
    )
  }
}

module.exports = Nav3Comp;
