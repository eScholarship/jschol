// ##### Header2 Component ##### //

import React from 'react'
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
        <a href="/">
          <picture>
            <source srcSet="/images/logo_temp-eschol-small.png" media={"(min-width: "+Breakpoints.screen3+")"}/>
            <img src="/images/logo_temp-eschol-mobile.png" alt="eScholarship"/>
          </picture>
        </a>  
        <div className={this.state.searchActive ? "c-header2__search--active" : "c-header2__search"}>
          <Search2Comp id={this.props.id}
                       type={this.props.type}
                       parents={this.props.parents}
                       onClose={ ()=>this.setState({searchActive: false}) } />
        </div>
        <button className="c-header2__search-open-button" aria-label="open search field" onClick = {()=> this.setState({searchActive: true})}></button>
      </div>
    )
  }
}

module.exports = HeaderComp2;
