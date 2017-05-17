// ##### Tabs Component ##### //

import React from 'react'
import $ from 'jquery'

import TabMainComp from '../components/TabMainComp.jsx'
import TabSupplementalComp from '../components/TabSupplementalComp.jsx'
import TabMetricsComp from '../components/TabMetricsComp.jsx'
import TabAuthorComp from '../components/TabAuthorComp.jsx'
import TabCommentsComp from '../components/TabCommentsComp.jsx'

class TabsComp extends React.Component {
  state = {moreTabs: false}

  tabFocus(tabName) {
    this.props.changeTab(tabName)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.currentTab != nextProps.currentTab) { 
      // For keyboard users, jump to heading within the tab.
      setTimeout(()=>$(".c-tabcontent__main-heading").focus(), 0)
    }
  }

  render() {
    return (
      <div className="c-tabs">
        <div className={this.state.moreTabs ? "c-tabs__tabs--show-all" : "c-tabs__tabs"}>
      { this.props.status == 'published' &&
          <button className="c-tabs__button-more" onClick = {()=> this.setState({moreTabs: !this.state.moreTabs})} aria-label="Show all tabs">...</button>
      }
          <button className={this.props.currentTab == "main" ? "c-tabs__button--active" : "c-tabs__button"}
                  onClick = {()=> this.tabFocus("main")}>
            Main Content</button>
      { this.props.status == 'published' &&
        [ this.props.attrs.supp_files &&
          <button key="2" className={this.props.currentTab == "supplemental" ? "c-tabs__button--active" : "c-tabs__button"}
                  onClick = {()=> this.tabFocus("supplemental")}>
            Supplemental material</button>
         ,
          <button key="3" className={this.props.currentTab == "metrics" ? "c-tabs__button--active" : "c-tabs__button"}
                  onClick = {()=> this.tabFocus("metrics")}>
            Metrics</button>]
      }
      { this.props.status != 'withdrawn' &&
          <button className={this.props.currentTab == "author" ? "c-tabs__button--active" : "c-tabs__button"}
                  onClick = {()=> this.tabFocus("author")}>
            Author & Article Info</button>
      }
        </div>
        <div className="c-tabs__content">
          {this.props.currentTab == "main"         ? <TabMainComp {...this.props} /> : null}
          {this.props.currentTab == "supplemental" ? <TabSupplementalComp {...this.props} /> : null}
          {this.props.currentTab == "metrics"      ? <TabMetricsComp {...this.props} /> : null}
          {this.props.currentTab == "author"       ? <TabAuthorComp {...this.props} /> : null}
          <p><br/></p>
        </div>
      </div>
    )
  }
}

module.exports = TabsComp;
