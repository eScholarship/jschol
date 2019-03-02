import React from 'react'
import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import MetaTagsComp from '../components/MetaTagsComp.jsx'

class LoginPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    return "/api/loginStart"
  }

  renderData(data) {
    if (!(typeof document === "undefined")) {
      // Only redirect on browser, not on server
      setTimeout(()=>{
        let prevPath = this.props.location.prevPathname
        window.location = "https://submit.escholarship.org/secure/jscholLogin?returnTo=" +
          encodeURIComponent(window.location.href.replace("/login",
            "/loginSuccess" + (prevPath && !prevPath.match(/login|logout/) ? prevPath : ""))) +
          "&nonce=" + this.state.pageData.nonce}, 100)
    }
    return (
      <div>
        <MetaTagsComp title="Login"/>
        <Header1Comp/>
        <div className="c-navbar">
          <NavComp data={data.header.nav_bar} />
        </div>
        <div className="c-columns">
          <main id="maincontent" tabIndex="-1">
            <section className="o-columnbox1">
              <header>
                <h1 className="o-columnbox1__heading">Login</h1>
              </header>
              <p>Redirecting to login page...</p>
            </section>
          </main>
        </div>
      </div>
    )
  }
}

module.exports = LoginPage
