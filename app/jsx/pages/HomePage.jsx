// ##### Home ##### //

import React from 'react'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import FooterComp from '../components/FooterComp.jsx'
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
        <Header1Comp />
        <div className="c-navbar">
          <NavComp data={data.header.nav_bar} />
        </div>
        <div className="c-columns">
          <main id="maincontent">
            <section className="o-columnbox1">
              <header>
                <h1>Welcome to the eScholarship Beta Preview</h1>
              </header>
              <p>Use the links below to explore the site and provide feedback:</p>
              <p>
                <ul>
                  <li><a href="/campuses">Explore Campus Sites</a></li>
                  <li><a href="/journals">Explore eScholarship Journals</a></li>
                  <li><a href="http://help.escholarship.org/support/solutions/articles/9000124100-using-the-site-editing-tool">Admins: Learn How to Customize Your Site</a></li>
                  <li><a href="http://help.escholarship.org/support/discussions/9000052123">Share Your Feedback and Ideas</a></li>
                  <li><a href="http://escholarship.org/">Return to the Public Site</a></li>
                </ul>
              </p>
            </section>
            <section className="o-columnbox1">
              <header>
                <h1>Statistics</h1>
              </header>
              <ul>
                <li># of items: {data.statsCountItems.toLocaleString()}</li>
                <li># of views: {data.statsCountViews.toLocaleString()}</li>
                <li># of eSchol Journals: {data.statsCountEscholJournals.toLocaleString()}</li>
                <li># of ORUs: {data.statsCountOrus.toLocaleString()}</li>
                <li># of Articles: {data.statsCountArticles.toLocaleString()}</li>
                <li># of Theses and Dissertations: {data.statsCountThesesDiss.toLocaleString()}</li>
                <li># of Books: {data.statsCountBooks.toLocaleString()}</li>
              </ul>
            </section>
          </main>
        </div>
      </div>
    )
  }
}

module.exports = HomePage;
