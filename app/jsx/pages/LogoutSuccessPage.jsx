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

  renderData() { return(
    <div>
      <Header1Comp/>
      <Nav1Comp/>
      <div className="c-columns">
        <main id="maincontent">
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
    </div>
  )}
}

module.exports = LogoutPage
