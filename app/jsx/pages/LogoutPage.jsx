import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import Nav1Comp from '../components/Nav1Comp.jsx'
import FooterComp from '../components/FooterComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'

let sessionStorage = (typeof window != "undefined") ? window.sessionStorage : null

class LogoutPage extends PageBase
{
  pageDataURL() { return null /* no API data */ }

  render() { return(
    <div>
      <Header1Comp/>
      <Nav1Comp/>
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
      <FooterComp/>
    </div>
  )}
}

module.exports = LogoutPage
