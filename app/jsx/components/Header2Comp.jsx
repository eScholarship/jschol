// ##### Header2 Component ##### //
// Header2 Component contains the eScholarship logo and the search box
// Used on all pages except homepage and main search page
// Props used to provide specificity to search box behavior

import React from 'react'
import Helmet from 'react-helmet'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import Search1Comp from '../components/Search1Comp.jsx'
import Search2Comp from '../components/Search2Comp.jsx'
import Breakpoints from '../../js/breakpoints.json'
import AdminBarComp from '../components/AdminBarComp.jsx'
import MEDIA_PATH from '../../js/MediaPath.js'

class HeaderComp2 extends React.Component {
  static propTypes = {
    type: PropTypes.string,       // not required, at least on global search page
          // i.e.: "campus|journal|oru|series|monograph_series|seminar_series|special"
    unitID: PropTypes.string,     // ditto
    searchComp: PropTypes.string, // ditto
    hideAdminBar: PropTypes.bool, // AdminBar not needed on Item page
    // query: PropTypes.string    // This is a hash of query parameters, too much stuff to detail right here right now
  }

  constructor(props){
    super(props)
    this.state = {searchActive: false}
  }
  render() {
    return (
      <div>
      {/* If this unitID is combinatorial_theory, load mathjax via Helmet */}
      {this.props.unitID=="combinatorial_theory" &&
        <Helmet>
          <script id="MathJaxConfig" src="/js/mathjax-config.js"/>
          <script id="MathJax-script" async
            src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js">
          </script>
        </Helmet>
      }
      {!this.props.hideAdminBar &&
        <AdminBarComp/>
      }
        <header id="#top" className="c-header">
          <Link className="c-header__logo2" to="/">
            <picture>
              <source srcSet={MEDIA_PATH + 'logo_eschol-small.svg'} media={"(min-width: "+Breakpoints.screen3+")"}/>
              <img src={MEDIA_PATH + 'logo_eschol-mobile.svg'} alt="eScholarship"/>
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

export default HeaderComp2;
