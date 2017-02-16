// ##### Item Page ##### //

import React from 'react'
import PageBase from './PageBase.jsx'
import Header2Comp from '../components/Header2Comp.jsx'
import SubheaderComp from '../components/SubheaderComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import TabsComp from '../components/TabsComp.jsx'
import JumpComp from '../components/JumpComp.jsx'
import FooterComp from '../components/FooterComp.jsx'

class ItemPage extends PageBase {
  state = { currentTab: 1 }

  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    return "/api/item/" + this.props.params.itemID
  }

  changeTab = tab_id => { this.setState({currentTab: tab_id}) }

  renderData = data => {
    let unitID = data.appearsIn.length > 0  && data.appearsIn[0]["id"]
    let unitName = data.appearsIn.length > 0  && data.appearsIn[0]["name"]
    return (
      <div className="l-item">
        <Header2Comp type={data.type} unitID={unitID} />
        <SubheaderComp type={data.type}
                        unitID={unitID} 
                        unitName={unitName}
                        campusID={data.campusID}
                        campusName={data.campusName}
                        campuses={data.campuses}/>
        {/* <NavBarComp 
          navBar={data.unitDisplay.nav_bar} unitId={data.unitData.id}/> */ }
        <BreadcrumbComp array={data.breadcrumb} />
        <div className="c-columns">
          <main>
            <TabsComp currentTab={this.state.currentTab}
                      changeTab={this.changeTab}
                      {...data} />
          </main>
          <aside>
            {(data.status == "published" && data.content_type) &&
              <section className="o-columnbox2">
                <header>
                  <h2 className="o-columnbox2__heading">Jump To</h2>
                  <JumpComp changeTab={this.changeTab} />
                </header>
              </section>
            }
            <section className="o-columnbox2">
              <header>
                <h2 className="o-columnbox2__heading">Related Items</h2>
                </header>
                [content to go here]
            </section>
          </aside>
        </div>
      </div>
    )
  }
}

module.exports = ItemPage;
