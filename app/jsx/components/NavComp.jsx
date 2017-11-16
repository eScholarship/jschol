// ##### Navigation Component ##### //
// this.props = {data: [
//   {name: 'External Link', url: ''}           i.e. submit.escholarship.org
//   {name: 'Internal Page', slug: ''},         i.e. About Us 
//   {name: 'Unit Page', unitId: ''},           i.e. Campus Home
//   {name: 'Subnavigation', sub_nav: []},      i.e. Issues 
//   {name: 'File Name', file: ''}              i.e. PDF
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

  onNavClick = () => this.setState({submenuActive: null})

  getNavItemJSX(navItem) {
    if (navItem.type == "link")
      return (<li key={navItem.id}><a href={navItem.url} onClick={this.onNavClick}>{navItem.name}</a></li>)
    else
      return (<li key={navItem.id}><Link to={navItem.url} onClick={this.onNavClick}>{navItem.name}</Link></li>)
  }

  render() {
    let navList = this.props.data.filter(navItem => !navItem.hidden).map((navItem) => {
      if (navItem.type == "folder") {
        return (
          <li key={navItem.id}>
            <NavSubComp name={navItem.name}
              open={this.state.submenuActive == navItem.name}
              onSubmenuChanged={(flag)=> this.setState({submenuActive:flag ? navItem.name : null})}>
              <ul>
              {navItem.sub_nav.filter(subItem => !subItem.hidden).map((subItem) => {
                return this.getNavItemJSX(subItem);
              })}
              </ul>
            </NavSubComp>
          </li>
        )
      } else {
        return this.getNavItemJSX(navItem);
      }
    })
    return (
      <nav className="c-nav">
        <details open={this.state.isOpen ? "open" : ""} className="c-nav__main" ref={(domNode)=> this.details = domNode}>
          <summary className="c-nav__main-button" onClick = {(event)=>{
            this.setState({isOpen: !this.details.open})
            event.preventDefault()
          }}><span>Menu</span>
          </summary>
          <ul className={this.state.submenuActive ? "c-nav__main-items--submenu-active" : "c-nav__main-items"}>
            {navList}
          </ul>
        </details>
      </nav>
    )
  }
}

module.exports = NavComp;
