// ##### About Layout ##### //

import React from 'react'
import Header1Comp from '../components/Header1Comp.jsx'
import Nav1Comp from '../components/Nav1Comp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import SidebarNavComp from '../components/SidebarNavComp.jsx'
import FooterComp from '../components/FooterComp.jsx'

class AboutLayout extends React.Component {
  render() {
    return (
      <div className="l-about">
        <Header1Comp />
        <Nav1Comp />
        <BreadcrumbComp />
        <div className="c-columns">
          <aside>
            <section className="o-columnbox2 c-sidebarnav">
              <header>
                <h1 className="o-columnbox2__heading">About eScholarship</h1>
              </header>
              <SidebarNavComp />
            </section>
          </aside>
          <main>
            <section className="o-columnbox1">
              <header>
                <h1 className="o-columnbox1__heading">About eScholarship</h1>
              </header>
              <p>eScholarship provides a suite of open access, scholarly publishing services and research tools that enable departments, research units, publishing programs, and individual scholars associated with the University of California to have direct control over the creation and dissemination of the full range of their scholarship.
              <p>With eScholarship, you can publish the following original scholarly works on a dynamic research platform available to scholars worldwide:</p>
              </p>
              <ul>
                <li><a className="o-textlink__primary" href="">Books</a></li>
                <li><a className="o-textlink__primary" href="">Journals</a></li>
                <li><a className="o-textlink__primary" href="">Working Papers</a></li>
                <li><a className="o-textlink__primary" href="">Previously Published Works</a></li>
                <li><a className="o-textlink__primary" href="">Conferences</a></li>
              </ul>
              <p>eScholarship also provides deposit and dissemination services for postprints, or previously published articles.</p>
              <p>Publications benefit from manuscript and peer-review management systems, as well as a full range of persistent access and preservation services.</p>
              <p>Learn more about what to expect from publishing with eScholarship.</p>
              <p>eScholarship is a service of the Publishing Group of the California Digital Library.</p>
              <p>Questions? <a className="o-textlink__primary" href="">Contact us</a>.</p>
            </section>
          </main>
        </div>
        <FooterComp />
      </div>
    )
  }
}

module.exports = AboutLayout;
