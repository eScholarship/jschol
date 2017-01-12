// ##### Header2 Component ##### //

import React from 'react'
import { Link } from 'react-router'
import Search2Comp from '../components/Search2Comp.jsx'
import Breakpoints from '../../js/breakpoints.json'

class HeaderComp2 extends React.Component {
  constructor(props){
    super(props)
    this.state = {searchActive: false}
  }
  render() {
    return (
      <div className="c-header2">
        <Link to="/">
          <picture>
            <source srcSet="/images/logo_temp-eschol-small.png" media={"(min-width: "+Breakpoints.screen3+")"}/>
            <img src="/images/logo_temp-eschol-mobile.png" alt="eScholarship"/>
          </picture>
        </Link>  
        <div className={this.state.searchActive ? "c-header2__search--active" : "c-header2__search"}>
          <Search2Comp type={this.props.type}
                       unitID={this.props.unitID}
                       onClose={ ()=>this.setState({searchActive: false}) } />
        </div>
        <button className="c-header2__search-open-button" aria-label="open search field" onClick = {()=> this.setState({searchActive: true})}></button>
      </div>
    )
  }
}

module.exports = HeaderComp2;
