import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import ServerErrorComp from '../components/ServerErrorComp.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import NavBarComp from '../components/NavBarComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import WizardComp from '../components/WizardComp.jsx'
import SidebarComp from '../components/SidebarComp.jsx'
import UnitStaticPageLayout from '../layouts/UnitStaticPageLayout.jsx'
import MetaTagsComp from '../components/MetaTagsComp.jsx'

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
  state = { modalOpen: false }

  closeWizardModal = e => {
    this.setState({modalOpen:false})
  }

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
        <MetaTagsComp title={data.pageNotFound ? "Not Found" :
                             (data.content && data.content.title) ? data.content.title :
                             "eScholarship"}/>
        { data.pageNotFound
          ? <NotFoundLayout/>
          : <div id="wizardModalBase">
              <BreadcrumbComp array={data.header.breadcrumb} />
              <button style={{display: 'none'}} id="wizardlyDeposit" onClick={(event)=>{
                  this.setState({modalOpen:true})
                  event.preventDefault()} } >Deposit</button>
              <WizardComp showModal={this.state.modalOpen}
                  parentSelector={()=>$('#wizardModalBase')[0]}
                  onCancel={e=>this.closeWizardModal(e)}
                  campuses={data.header.campuses}
                  data={{campusID: null, campusName: null, unitID: null, unitName: null}}
                />
              <UnitStaticPageLayout unit={data.unit} data={data.content} sidebar={sidebar} fetchPageData={this.fetchPageData}/>
            </div>
        }
      </div>
    )
  }

}
