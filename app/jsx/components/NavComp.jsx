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
    if (navItem.url) {
      return (
        <a href={navItem.url} key={navItem.name}>
          {navItem.name}
        </a>
      )
    }
    if (navItem.slug) {
      return (
        <Link key={navItem.slug} to={"/unit/" + this.props.unitId + "/" + navItem.slug }>{navItem.name}</Link>
      )
    }
    //TODO: if ('file' in navItem)...
    if (navItem.file) {
      return (
        <a key={navItem.name}>{navItem.name}</a>
      )
    }
    return <a key={navItem.name}>{navItem.name}</a>
  }

  render() {
    var navList = this.props.data.map((navItem) => {
      if ('sub_nav' in navItem) {
        return (
          <NavSubComp name={navItem.name}
            open={this.state.submenuActive == navItem.name}
            onSubmenuChanged={(flag)=> this.setState({submenuActive:flag ? navItem.name : null})}
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
      <div className="c-nav">
        <details open={this.state.isOpen ? "open" : ""} aria-expanded={this.state.isOpen ? "true" : "false"} className="c-nav__main" ref={(domNode)=> this.details = domNode}>
          <summary className="c-nav__main-button" onClick = {(event)=>{
            this.setState({isOpen: !this.details.open})
            event.preventDefault()
          }}>Menu
          </summary>
          <nav className={this.state.submenuActive ? "c-nav__main-items--submenu-active" : "c-nav__main-items"}>
            {navList}
          </nav>
        </details>
      </div>
    )
  }
}

module.exports = NavComp;
