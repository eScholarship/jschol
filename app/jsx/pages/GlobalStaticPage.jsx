import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import FooterComp from '../components/FooterComp.jsx'
import ServerErrorComp from '../components/ServerErrorComp.jsx'
import UnitStaticPageLayout from '../layouts/UnitStaticPageLayout.jsx'
import NavBarComp from '../components/NavBarComp.jsx'
import SidebarComp from '../components/SidebarComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'

class NotFoundLayout extends React.Component
{
  render = () =>
    <div className="c-columns">
      <main id="maincontent">
        <section className="o-columnbox1">
          <ServerErrorComp error="Not Found"/>
        </section>
      </main>
    </div>
}

export default class GlobalStaticPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    return `/api/globalStatic/${this.props.params.splat}`
  }

  // Unit ID for permissions checking
  pagePermissionsUnit() {
    return "root"
  }

  renderData(data) {
    let sidebar = <SidebarComp data={data.sidebar}/>
    return(
      <div>
        <Header1Comp/>
        <NavBarComp navBar={data.header.nav_bar} unit={data.unit} socialProps={data.header.social} />
        { data.pageNotFound
          ? <NotFoundLayout/>
          : <div>
              <BreadcrumbComp array={data.header.breadcrumb} />
              <UnitStaticPageLayout unit={data.unit} data={data.content} sidebar={sidebar} fetchPageData={this.fetchPageData}/>
            </div>
        }
      </div>
    )
  }

}
