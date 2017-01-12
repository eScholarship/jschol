import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import HeaderComp from '../components/HeaderComp.jsx'
import NavComp from '../components/NavComp.jsx'
import FooterComp from '../components/FooterComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'

let sessionStorage = (typeof window != "undefined") ? window.sessionStorage : null

class LogoutPage extends PageBase
{
  constructor(props) {
    super(props)
    if (sessionStorage)
      sessionStorage.removeItem("admin")
    this.state.admin = null // cancel existing login
  }

  pageDataURL(props) { return null /* no API data */ }

  render() { return(
    <div>
      <HeaderComp admin={this.state.admin}/>
      <NavComp/>
      <div className="c-columns">
        <main>
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">Logout</h1>
            </header>
            <div>
              <p>Logged out.</p>
              { this.props.location.prevPathname &&
                <p>You may <Link to={this.props.location.prevPathname}>return</Link> to where you were.</p> }
            </div>
          </section>
        </main>
      </div>
      <FooterComp admin={this.state.admin}/>
    </div>
  )}
}

module.exports = LogoutPage
