// ##### Home ##### //

import React from 'react'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import FooterComp from '../components/FooterComp.jsx'
import AdminBarComp from '../components/AdminBarComp.jsx'
import SidebarComp from '../components/SidebarComp.jsx'

class HomePage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    return "/api/home"
  }

  pagePermissionsUnit() {
    return "root"
  }

  renderData(data) { 
    return(
      <div>
        <AdminBarComp/>
        <Header1Comp />
        <div className="c-navbar">
          <NavComp data={data.header.nav_bar} />
        </div>
        <div className="c-columns">
          <main id="maincontent">
            <section className="o-columnbox1">
              <header>
                <h1>Home Page</h1>
              </header>
              <p>Home page content here</p>
            </section>
          </main>
          <aside>
            <SidebarComp data={data.sidebar}/>
          </aside>
        </div>
      </div>
    )
  }
}

module.exports = HomePage;
