// ##### Tabs Component ##### //

import React from 'react'
import $ from 'jquery'

import TabMainComp from '../components/TabMainComp.jsx'
import TabSupplementalComp from '../components/TabSupplementalComp.jsx'
import TabMetricsComp from '../components/TabMetricsComp.jsx'
import TabAuthorComp from '../components/TabAuthorComp.jsx'
import TabCommentsComp from '../components/TabCommentsComp.jsx'

class TabsComp extends React.Component {
  state = {currentTab: this.props.currentTab, moreTabs: false}

  tabFocus(tabName) {
    // For keyboard users, jump to heading within the tab.
    setTimeout(()=>$(".c-tabcontent__heading").focus(), 0)
    this.setState({currentTab: tabName})
    // window.location.hash=tabName
  }

  componentWillReceiveProps(nextProps) {
    this.setState({currentTab: nextProps.currentTab})
    this.tabFocus(nextProps.currentTab)
  }

  render() {
    return (
      <div className="c-tabs">
        <div className={this.state.moreTabs ? "c-tabs__tabs--show-all" : "c-tabs__tabs"}>
          {/* TODO: programmatically remove 'c-tabs__button-more' button below if there is only 1 tab */}
          <button className="c-tabs__button-more" onClick = {()=> this.setState({moreTabs: !this.state.moreTabs})} aria-label="Show all tabs">...</button>
          <button className={this.state.currentTab == "main" ? "c-tabs__button--active" : "c-tabs__button"}
                  onClick = {()=> this.tabFocus("main")}>
            Main Content</button>
      { this.props.status != 'withdrawn' && this.props.status != 'embargoed' &&
        [ this.props.attrs.supp_files &&
          <button key="2" className={this.state.currentTab == "supplemental" ? "c-tabs__button--active" : "c-tabs__button"}
                  onClick = {()=> this.tabFocus("supplemental")}>
            Supplemental material</button>
         ,
          <button key="3" className={this.state.currentTab == "metrics" ? "c-tabs__button--active" : "c-tabs__button"}
                  onClick = {()=> this.tabFocus("metrics")}>
            Metrics</button>]
      }
      { this.props.status != 'withdrawn' &&
          <button className={this.state.currentTab == "author" ? "c-tabs__button--active" : "c-tabs__button"}
                  onClick = {()=> this.tabFocus("author")}>
            Author & Article Info</button>
      }
        </div>
        <div className="c-tabs__content">
          {this.state.currentTab == "main"         ? <TabMainComp {...this.props} /> : null}
          {this.state.currentTab == "supplemental" ? <TabSupplementalComp {...this.props} /> : null}
          {this.state.currentTab == "metrics"      ? <TabMetricsComp {...this.props} /> : null}
          {this.state.currentTab == "author"       ? <TabAuthorComp {...this.props} /> : null}
          <p><br/></p>
        </div>
      </div>
    )
  }
}

module.exports = TabsComp;
