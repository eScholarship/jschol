import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import FooterComp from '../components/FooterComp.jsx'
import ServerErrorComp from '../components/ServerErrorComp.jsx'

class NotFoundPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    return "/api/notFound"
  }

  renderData(data) {
    return (
    <div>
      <Header1Comp/>
      <div className="c-navbar">
      </div>
      <div className="c-columns">
        <main id="maincontent">
          <section className="o-columnbox1">
            <ServerErrorComp error="Not Found"/>
          </section>
        </main>
      </div>
    </div>
  )}

}

module.exports = NotFoundPage
