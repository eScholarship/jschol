// ##### Item Page ##### //

import React from 'react'
import $ from 'jquery'

import PageBase from './PageBase.jsx'
import Header2Comp from '../components/Header2Comp.jsx'
import Subheader2Comp from '../components/Subheader2Comp.jsx'
import NavBarComp from '../components/NavBarComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import TabsComp from '../components/TabsComp.jsx'
import JumpComp from '../components/JumpComp.jsx'
import FooterComp from '../components/FooterComp.jsx'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

const anchors = ['main', 'supplemental', 'metrics', 'author',
             'article_abstract', 'article_main', 'article_references']

class ItemPage extends PageBase {
  static propTypes = {
    currentTab: React.PropTypes.oneOf(anchors)
  }

  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    return "/api/item/" + this.props.params.itemID
  }

  tabNameFromHash() {
    return !(typeof location === "undefined") ? location.hash.toLowerCase().replace(/^#/, "") : ""
  }

  // currentTab should be 'main' whenever hash starts with 'article_" (or is empty)
  articleHashHandler = h => { return ((h.startsWith("article") || h=='') ? "main" : h) }

  state = { currentTab: this.articleHashHandler(this.tabNameFromHash()) }

  componentDidMount() {
    // Check hash whenever back or forward button clicked
    window.onpopstate = (event) => {
      var h = this.articleHashHandler(this.tabNameFromHash())
      if ((h != this.state.currentTab) && anchors.includes(h)) {
        this.setState({currentTab: h})
      }
    }
  }

  formatDate = d => {
    let x = d ? new Date(d) : new Date(),
        locale = "en-us",
        month = x.toLocaleString(locale, { month: "long" })
    return (month + " " + x.getDay() + ", " + x.getFullYear())
  }

  changeTab = tabName => {
    this.setState({currentTab: this.articleHashHandler(tabName) })
    // Set hash based on what was clicked.
    window.location.hash=tabName
  }

  renderData = data => {
    return (
      <div>
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
        <div className="c-columns--sticky-sidebar">
          <main id="maincontent">
            <TabsComp currentTab={this.state.currentTab}
                      changeTab={this.changeTab}
                      formatDate={this.formatDate}
                      {...data} />
          </main>
          <aside>
            {(data.status == "published" && data.content_type) &&
              <section className="o-columnbox1">
                <header>
                  <h2>Jump To</h2>
                </header>
                <JumpComp changeTab={this.changeTab} attrs={data.attrs} />
              </section>
            }
            <section className="o-columnbox1">
              <header>
                <h2>Related Items</h2>
              </header>
              <p><a className="o-textlink__secondary" href="">Collaborative Film Authorship: Writing Latinas Into the Picture</a><br/>CSW update</p>
              <p><a className="o-textlink__secondary" href="">Sporting Bodies, Displaying History: Black Embodiment</a><br/>UCLA Electronic Theses and Dissertations</p>
              <p><a className="o-textlink__secondary" href="">United States-Based Latina Producers of Feature Films</a><br/>UCLA Electronic Theses and Dissertations</p>
            </section>
          </aside>
        </div>
      </div>
    )
  }
}

module.exports = ItemPage;
