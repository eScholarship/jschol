import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import Nav1Comp from '../components/Nav1Comp.jsx'
import FooterComp from '../components/FooterComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'

class LogoutPage extends PageBase
{
  pageDataURL() { return null /* no API data */ }

  render() {
    if (!(typeof document === "undefined")) {
      // Only redirect on browser, not on server
      setTimeout(()=>{
        window.location = "https://submit.escholarship.org/Shibboleth.sso/Logout?return=" +
          encodeURIComponent(window.location.href.replace("/logout", "/logoutSuccess"))}, 100)
    }
    return (
      <div>
        <Header1Comp/>
        <Nav1Comp />
        <div className="c-columns">
          <main>
            <section className="o-columnbox1">
              <header>
                <h1 className="o-columnbox1__heading">Logout</h1>
              </header>
              <p>Redirecting to logout page...</p>
            </section>
          </main>
        </div>
      </div>
    )
  }
}

module.exports = LogoutPage
