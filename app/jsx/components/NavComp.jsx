// ##### Navigation Component ##### //
// this.props = {data: [
//   {name: 'Journal Home', slug: ''},
//   {name: 'Issues', subNav: []},
//   {name: 'About', subNav: []}
//   ...
// ]}

import React from 'react'
import NavSubComp from '../components/NavSubComp.jsx'
import Breakpoints from '../../js/breakpoints.json'
import { Link } from 'react-router'

class NavComp extends React.Component {
  constructor(props){
    super(props)
    this.state = {submenuActive: null}
  }
  componentWillMount() {
    if (matchMedia) {
      this.mq = matchMedia("(min-width:"+Breakpoints.screen3+")")
      this.mq.addListener(this.widthChange)
      this.widthChange()
    }
  }
  widthChange = ()=> {
    this.setState({isOpen: this.mq.matches})
  }
  render() {
    var navList = this.props.data.map((navItem) => {
      // if ('subNav' in navItem) {
      //   return (
      //     <NavSubComp name={navItem.name}
      //       open={this.state.submenuActive == 1}
      //       onSubmenuChanged={(flag)=> this.setState({submenuActive:flag ? 1 : null})}>
      //       {navItem.subNav.map((subItem) => {
      //         (<Link to={subItem.url} role="listitem">{subItem.name}</Link>)
      //       })}
      //     </NavSubComp>
      //   )
      // } else {
        return (
          <Link to={"/unit/" + this.props.unitId + "/" + navItem.slug }>{navItem.name}</Link>
        )
      // }
    })
    return (
      <nav className="c-nav">
        <details open={this.state.isOpen ? "open" : ""} className="c-nav__main">
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
