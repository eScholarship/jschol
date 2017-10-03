// ##### Item Page ##### //

import React from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'

import PageBase from './PageBase.jsx'
import Header2Comp from '../components/Header2Comp.jsx'
import SubheaderComp from '../components/SubheaderComp.jsx'
import NavBarComp from '../components/NavBarComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import TabsComp from '../components/TabsComp.jsx'
import JumpComp from '../components/JumpComp.jsx'
import SidebarComp from '../components/SidebarComp.jsx'
import FooterComp from '../components/FooterComp.jsx'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

const tab_anchors = ['main', 'supplemental', 'metrics', 'author']
const anchors = tab_anchors.concat(['article_abstract', 'article_main', 'article_references'])

class ItemPage extends PageBase {
  static propTypes = {
    currentTab: PropTypes.oneOf(anchors)
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
    let currentTab = tab_anchors.includes(this.state.currentTab) ? this.state.currentTab : "main" 
    return (
      <div>
        <Header2Comp type={data.unit ? data.unit.type: null}
                     unitID={(data.appearsIn && data.appearsIn.length > 0) ? data.appearsIn[0]["id"] : null } />
        {/* Some items have no parent unit, so check for empty data.header */}
        {data.header && <SubheaderComp unit={data.unit} header={data.header} />}
        {data.header && <NavBarComp navBar={data.header.nav_bar} 
                                    unit={data.unit} 
                                    socialProps={data.header.social} />}
        <BreadcrumbComp array={data.header ? data.header.breadcrumb : null} />
        <div className="c-columns--sticky-sidebar">
          <main id="maincontent">
            <TabsComp currentTab={currentTab}
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
          {data.sidebar &&
            <SidebarComp data={data.sidebar}/> }
          </aside>
        </div>
      </div>
    )
  }
}

module.exports = ItemPage;
