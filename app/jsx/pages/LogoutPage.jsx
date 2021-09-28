import React from 'react'
import { Link } from 'react-router-dom'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import FooterComp from '../components/FooterComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import MetaTagsComp from '../components/MetaTagsComp.jsx'

class LogoutPage extends PageBase
{
  componentDidMount() {
    super.componentDidMount()
    if (!(typeof document === "undefined")) {
      // Only redirect on browser, not on server
      setTimeout(()=>{
        this.sendApiData('POST', '/api/logout', {})
        let prevPath = this.props.location.prevPathname
        window.location = "https://submit.escholarship.org/Shibboleth.sso/Logout?return=" +
          encodeURIComponent(window.location.href.replace("/logout",
            "/logoutSuccess" + (prevPath && !prevPath.match(/login|logout/) ? prevPath : "")))
      }, 100)
    }
  }

  renderData(data) {
    return (
      <div>
        <MetaTagsComp title="Logout"/>
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
              <p>Redirecting to logout page...</p>
            </section>
          </main>
        </div>
      </div>
    )
  }
}

export default LogoutPage
