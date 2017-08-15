// ##### Header2 Component ##### //
// Header2 Component contains the eScholarship logo and the search box
// Used on all pages except homepage and main search page
// Props = {type: "campus|journal|oru|series|monograph_series|seminar_series|special", unitID: "<unitID>"}
// Props used to provide specificity to search box behavior

import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import Search1Comp from '../components/Search1Comp.jsx'
import Search2Comp from '../components/Search2Comp.jsx'
import Breakpoints from '../../js/breakpoints.json'
import AdminBarComp from '../components/AdminBarComp.jsx'

class HeaderComp2 extends React.Component {
  static propTypes = {
    type: PropTypes.string,       // not required, at least on global search page
    unitID: PropTypes.string,     // ditto
    searchComp: PropTypes.string, // ditto
    query: PropTypes.string
  }

  constructor(props){
    super(props)
    this.state = {searchActive: false}
  }
  render() {
    return (
      <div>
        <AdminBarComp/>
        <header className="c-header">
          <Link className="c-header__logo2" to="/">
            <picture>
              <source srcSet="/images/logo_eschol-small.svg" media={"(min-width: "+Breakpoints.screen3+")"}/>
              <img src="/images/logo_eschol-mobile.svg" alt="eScholarship"/>
            </picture>
            <div className="c-header__logo2-tagline">
              Open Access Publications from the University of California
            </div>
          </Link>  
          <div className={this.state.searchActive ? "c-header__search--active" : "c-header__search"}>
          {this.props.searchComp && this.props.searchComp == "1" ?
            <Search1Comp query={this.props.query}
                         onClose = {()=>this.setState({searchActive: false})} />
            :
            <Search2Comp type={this.props.type}
                         unitID={this.props.unitID}
                         onClose={ ()=>this.setState({searchActive: false}) } />
          }
          </div>
          <button className="c-header__search-open-button" aria-label="open search field" onClick = {()=> this.setState({searchActive: true})}></button>
        </header>
      </div>
    )
  }
}

module.exports = HeaderComp2;
