// ##### Header1 Component ##### //

import React from 'react'
import { Link } from 'react-router'
import Search1Comp from '../components/Search1Comp.jsx'
import Breakpoints from '../../js/breakpoints.json'
import AdminBarComp from '../components/AdminBarComp.jsx'

class HeaderComp1 extends React.Component {
  constructor(props){
    super(props)
    this.state = {searchActive: false}
  }
  render() {
    return (
    <div>
      { this.props.admin ? <AdminBarComp admin={this.props.admin}/> : null }
      <div className="c-header1">
        <div className="c-header1__logosearch">
          <Link to="/">
            <picture>
              <source srcSet="/images/logo_escholarship.svg" media={"(min-width: "+Breakpoints.screen2+")"}/>
              <img src="/images/logo_temp-eschol-mobile.png" alt="eScholarship"/>
            </picture>
          </Link>  
          <div className={this.state.searchActive ? "c-header1__search--active" : "c-header1__search"}>
            <Search1Comp onClose = {()=>this.setState({searchActive: false})} />
          </div>
          <button className="c-header1__search-open-button" aria-label="open search field" onClick = {()=> this.setState({searchActive: true})}></button>
        </div>
        <div className="c-header1__deposit">
          <button className="c-header1__deposit-button">Get Started</button>
        </div>
      </div>
    </div>
    )
  }
}

module.exports = HeaderComp1;
