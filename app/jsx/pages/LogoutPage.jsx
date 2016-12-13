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
      sessionStorage.removeItem("loggedIn")
    this.state.loggedIn = null // cancel exiting login
  }

  pageDataURL(props) { return null /* no API data */ }

  render() { return(
    <div>
      <HeaderComp loggedIn={this.state.loggedIn}/>
      <NavComp/>
      <div className="c-columns">
        <main>
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">Logout</h1>
            </header>
            <div>
              You have logged out.
            </div>
          </section>
        </main>
      </div>
      <FooterComp loggedIn={this.state.loggedIn}/>
    </div>
  )}
}

module.exports = LogoutPage
