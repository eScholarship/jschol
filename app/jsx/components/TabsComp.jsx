// ##### Tabs Component ##### //

import React from 'react'
import $ from 'jquery'
import Contexts from '../contexts.jsx'
import TabMainComp from '../components/TabMainComp.jsx'
import TabSupplementalComp from '../components/TabSupplementalComp.jsx'
import TabMetricsComp from '../components/TabMetricsComp.jsx'
import TabAuthorComp from '../components/TabAuthorComp.jsx'
import TabMetaComp from '../components/TabMetaComp.jsx'

class TabsComp extends React.Component {
  state = {moreTabs: false}

  tabFocus(tabName) {
    this.props.changeTab(tabName)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.currentTab != nextProps.currentTab) { 
      // For keyboard users, jump to heading within the tab.
      setTimeout(() =>$(".c-tabcontent__main-heading").focus(), 0)
    }
  }

  render() {
    let p = this.props 
    // "Multimedia Item" is a published item with no content type and no published web location,
    //  but with supplemental media. When the item is a Multimedia Item, we
    //  don't need to display the Supplemental Media tab
    let multimediaItem = p.status=='published' && !p.content_type && !p.attrs.pub_web_loc && p.attrs.supp_files && p.attrs.supp_files.length > 0
    return (
      <div className="c-tabs">
        <div className={this.state.moreTabs ? "c-tabs__tabs--show-all" : "c-tabs__tabs"}>
      { ["published", "empty"].includes(this.props.status) &&
          <button className="c-tabs__button-more" onClick = {() => this.setState({moreTabs: !this.state.moreTabs})} aria-label="Show all tabs">...</button>
      }
          <button className={p.currentTab == "main" ? "c-tabs__button--active" : "c-tabs__button"}
                  onClick = {() => this.tabFocus("main")}>
            Main Content</button>
      { p.status == 'published' && p.attrs.supp_files && !multimediaItem &&
          <button className={p.currentTab == "supplemental" ? "c-tabs__button--active" : "c-tabs__button"}
                  onClick = {() => this.tabFocus("supplemental")}>
            Supplemental Material</button>
      }
      { p.status == 'published' &&
          <button className={p.currentTab == "metrics" ? "c-tabs__button--active" : "c-tabs__button"}
                  onClick = {() => this.tabFocus("metrics")}>
            Metrics</button>
      }
      { !/withdrawn/.test(p.status) &&
          <button className={p.currentTab == "author" ? "c-tabs__button--active" : "c-tabs__button"}
                  onClick = {() => this.tabFocus("author")}>
            Author & Article Info</button>
      }
      <Contexts.CMS.Consumer>
        { cms => 
          (cms.loggedIn && cms.permissions && cms.permissions.super) ?
          <button className={p.currentTab == "meta" ? "c-tabs__button--active" : "c-tabs__button"}
                onClick = {() => this.tabFocus("meta")}>
            Meta</button>
         : null
        }
      </Contexts.CMS.Consumer>
        </div>
        <div className="c-tabs__content">
          {/* 'tab_anchors' are defined in ItemPage component */}
          {p.currentTab == "main"         && <TabMainComp {...p} />}
          {p.currentTab == "supplemental" && <TabSupplementalComp {...p} />}
          {p.currentTab == "metrics"      && <TabMetricsComp {...p} />}
          {p.currentTab == "author"       && <TabAuthorComp {...p} />}
          {p.currentTab == "meta"         && 
            <Contexts.CMS.Consumer>
              { cms => 
                (cms.loggedIn && cms.permissions && cms.permissions.super) ?
                <TabMetaComp {...p} />
               : null
              }
            </Contexts.CMS.Consumer>
          }
          <p><br/></p>
        </div>
      </div>
    )
  }
}

module.exports = TabsComp;
