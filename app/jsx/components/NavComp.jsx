// ##### Navigation Component ##### //
// this.props = {data: [
//   {name: 'Journal Home', slug: ''},
//   {name: 'Issues', sub_nav: []},
//   {name: 'External Link', url: ''}
//   {name: 'File Name', file: ''}
//   ...
// ]}

import React from 'react'
import NavSubComp from '../components/NavSubComp.jsx'
import Breakpoints from '../../js/breakpoints.json'
import { Link } from 'react-router'

class NavComp extends React.Component {
  constructor(props){
    super(props)
    this.state = {submenuActive: null, isOpen: true /* default to true for server-side */}
  }
  componentWillMount() {
    if (!(typeof matchMedia === "undefined")) {
      this.mq = matchMedia("(min-width:"+Breakpoints.screen3+")")
      this.mq.addListener(this.widthChange)
      this.widthChange()
    }
  }
  widthChange = ()=> {
    this.setState({isOpen: this.mq.matches})
  }

  getNavItemJSX(navItem) {
    if ('url' in navItem) {
      return (
        <a href={navItem.url} key={navItem.name}>
          {navItem.name}
        </a>
      )
    }
    if ('slug' in navItem) {
      return (
        <Link key={navItem.slug} to={"/unit/" + this.props.unitId + "/" + navItem.slug }>{navItem.name}</Link>
      )
    }
    //TODO: if ('file' in navItem)...
    if ('file' in navItem) {
      return (
        <a>{navItem.name}</a>
      )
    }
    return undefined
  }

  render() {
    var navList = this.props.data.map((navItem) => {
      if ('sub_nav' in navItem) {
        return (
          <NavSubComp name={navItem.name}
            open={this.state.submenuActive == 1}
            onSubmenuChanged={(flag)=> this.setState({submenuActive:flag ? 1 : null})}
            key={navItem.name}>
            {navItem.sub_nav.map((subItem) => {
              return this.getNavItemJSX(subItem);
            })}
          </NavSubComp>
        )
      } else {
        return this.getNavItemJSX(navItem);
      }
    })
    return (
      <nav className="c-nav">
        <details open={this.state.isOpen} className="c-nav__main">
          <summary className="c-nav__main-button">Menu
          </summary>
          <div className={this.state.submenuActive ? "c-nav__main-items--submenu-active" : "c-nav__main-items"} role="list">
            {navList}
          </div>
        </details>
      </nav>
    )
  }
}

module.exports = NavComp;
