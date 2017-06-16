import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import FooterComp from '../components/FooterComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'

class LogoutSuccessPage extends PageBase
{
  pageDataURL() { return "/api/logoutSuccess" }

  renderData(data) {
    if (!(typeof document === "undefined")) {
      // Return to the page whence the user originally came, if any
      if (this.props.params.splat)
        setTimeout(()=>this.props.router.push("/" + this.props.params.splat), 1000)
    }
    return(
    <div>
      <Header1Comp/>
      <div className="c-navbar">
        <NavComp data={data.header.nav_bar} />
      </div>
      <div className="c-columns">
        <main id="maincontent">
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">Logout</h1>
            </header>
            <div>
              <p>Logged out.</p>
              {this.props.params.splat &&
                <p>Returning to where you left off...</p>
              }
            </div>
          </section>
        </main>
      </div>
    </div>
  )}
}

module.exports = LogoutSuccessPage
