// ##### Item Page ##### //

import React from 'react'

import PageBase from './PageBase.jsx'
import Header2Comp from '../components/Header2Comp.jsx'
import Subheader2Comp from '../components/Subheader2Comp.jsx'
import NavBarComp from '../components/NavBarComp.jsx'
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
    return (
      <div>
        <a href="#maincontent" className="c-skipnav">Skip to main content</a>
        <Header2Comp type={data.unit ? data.unit.type: null}
                     unitID={data.appearsIn.length > 0 ? data.appearsIn[0]["id"] : null } />
        {data.header && <Subheader2Comp unit={data.unit}
                                        campusID={data.header.campusID}
                                        campusName={data.header.campusName}
                                        campuses={data.header.campuses} />}
        {data.header && <NavBarComp navBar={data.header.nav_bar} 
                                    unit={data.unit} 
                                    socialProps={data.header.social} />}
        <BreadcrumbComp array={data.header ? data.header.breadcrumb : null} />
        <div className="c-columns">
          <main id="maincontent">
            <TabsComp currentTab={this.state.currentTab}
                      changeTab={this.changeTab}
                      {...data} />
          </main>
          <aside>
            {(data.status == "published" && data.content_type) &&
              <section className="o-columnbox2">
                <header>
                  <h2>Jump To</h2>
                  <JumpComp changeTab={this.changeTab} />
                </header>
              </section>
            }
            <section className="o-columnbox2">
              <header>
                <h2>Related Items</h2>
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
