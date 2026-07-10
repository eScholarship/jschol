// ##### Header1 Component ##### //

import React from 'react'
import { Link } from 'react-router-dom'
import Breakpoints from '../../js/breakpoints.json'
import Search1Comp from '../components/Search1Comp.jsx'
import AdminBarComp from '../components/AdminBarComp.jsx'
import MEDIA_PATH from '../../js/MediaPath.js'
import NotificationComp from '../components/NotificationComp.jsx'

class HeaderComp1 extends React.Component {
  state = {searchActive: false}
  render() {
    return (
    <div>
      <AdminBarComp/>
      <header id="top" tabIndex="-1" className="c-header">
        <Link className="c-header__logo1" to="/">
          <picture>
            <source srcSet={MEDIA_PATH + 'logo_escholarship.svg'} media={"(min-width: "+Breakpoints.screen3+")"}/>
            <img src={MEDIA_PATH + 'logo_eschol-mobile.svg'} alt="eScholarship"/>
          </picture>
        </Link>
        <div className={this.state.searchActive ? "c-header__search--active" : "c-header__search"}>
          <Search1Comp onClose = {()=>this.setState({searchActive: false})} />
        </div>
        <button className="c-header__search-open-button" aria-label="open search field" onClick = {()=> this.setState({searchActive: true})}></button>
      </header>
      <NotificationComp>
        <span>
          Note: the eScholarship site's performance may be inconsistent July 13–24. {" "}
          <a href="https://help.escholarship.org/support/discussions/topics/9000064214">
            (Learn more).
          </a>
        </span>
        <br />
        <span>
          Please <a href="https://help.escholarship.org/support/discussions/topics/9000064214">provide feedback</a> if you encounter any issues.  
        </span>
      </NotificationComp>
    </div>
    )
  }
}

export default HeaderComp1;
