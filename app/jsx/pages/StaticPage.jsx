
import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import Nav1Comp from '../components/Nav1Comp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import SidebarNavComp from '../components/SidebarNavComp.jsx'

class StaticPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL(props) {
    return "/api/static/" + props.params.unitID + "/" + props.params.pageName
  }

  // PageBase calls this when the API data has been returned to us
  renderData(data) { 
    return(
    <div className="l-about">
      <Header1Comp />
      <Nav1Comp />
      <BreadcrumbComp array={data.breadcrumb} />
      <div className="c-columns">
        <aside>
          <section className="o-columnbox2 c-sidebarnav">
            <header>
              <h1 className="o-columnbox2__heading">{data.page.title}</h1>
            </header>
            <SidebarNavComp links={data.sidebarNavLinks}/>
          </section>
        </aside>
        <main>
          <section className="o-columnbox1">
            <header>
              <h1 className="o-columnbox1__heading">{data.page.title}</h1>
            </header>
            <div dangerouslySetInnerHTML={{__html: data.page.html}}/>
            {/*
            <p>eScholarship provides a suite of open access, scholarly publishing services and research tools that enable departments, research units, publishing programs, and individual scholars associated with the University of California to have direct control over the creation and dissemination of the full range of their scholarship.</p>
            <p>With eScholarship, you can publish the following original scholarly works on a dynamic research platform available to scholars worldwide:</p>
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
            <p>Questions? <a className="o-textlink__primary" href="">Contact us</a>.</p>*/}
          </section>
        </main>
        <aside>
          <section className="o-columnbox2 c-sidebarnav">
            <header>
              <h1 className="o-columnbox2__heading">Featured Articles</h1>
            </header>
            <nav className="c-sidebarnav">
              Foo bar
            </nav>
          </section>
          <section className="o-columnbox2 c-sidebarnav">
            <header>
              <h1 className="o-columnbox2__heading">New Journal Issues</h1>
            </header>
            <nav className="c-sidebarnav">
              Foo bar
            </nav>
          </section>
        </aside>
      </div>
    </div>
  )}
}

module.exports = StaticPage;
