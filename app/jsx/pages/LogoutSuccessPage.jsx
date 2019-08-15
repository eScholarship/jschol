import React from 'react'
import { Link } from 'react-router-dom'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import FooterComp from '../components/FooterComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import MetaTagsComp from '../components/MetaTagsComp.jsx'

class LogoutSuccessPage extends PageBase
{
  renderData(data) {
    if (!(typeof document === "undefined")) {
      // Return to the page whence the user originally came, if any
      if (this.props.match.params[0])
        setTimeout(()=>this.props.history.push("/" + this.props.match.params[0]), 1000)
    }
    return(
    <div>
      <MetaTagsComp title="Logout Success"/>
      <Header1Comp/>
      <div className="c-navbar">
        <NavComp data={data.header.nav_bar} />
      </div>
      <div className="c-columns">
        <main id="maincontent" tabIndex="-1">
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">Logout</h1>
            </header>
            <div>
              <p>Logged out.</p>
              {this.props.match.params[0] &&
                <p>Returning to where you left off...</p>
              }
            </div>
          </section>
        </main>
      </div>
    </div>
  )}
}

export default LogoutSuccessPage
