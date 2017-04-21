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

  tabFocus(tabNumber) {
    // For keyboard users, jump to heading within the tab.
    setTimeout(()=>$(".c-tabcontent__heading").focus(), 0)
    this.setState({currentTab: tabNumber})
  }

  componentWillReceiveProps(nextProps) {
    this.setState({currentTab: nextProps.currentTab})
    this.tabFocus(nextProps.currentTab)
  }

  render() {
    return (
      <div className="c-tabs">
        <div className={this.state.moreTabs ? "c-tabs__tabs--show-all" : "c-tabs__tabs"}>
          <button className="c-tabs__button-more" onClick = {()=> this.setState({moreTabs: !this.state.moreTabs})} aria-label="Show all tabs">...</button>
          <button className={this.state.currentTab === 1 ? "c-tabs__button--active" : "c-tabs__button"}
                  onClick = {()=> this.tabFocus(1)}>
            Main Content</button>
      { this.props.status != 'withdrawn' && this.props.status != 'embargoed' &&
        [ this.props.attrs.supp_files &&
          <button key="2" className={this.state.currentTab === 2 ? "c-tabs__button--active" : "c-tabs__button"}
                  onClick = {()=> this.tabFocus(2)}>
            Supplemental material</button>
         ,
          <button key="3" className={this.state.currentTab === 3 ? "c-tabs__button--active" : "c-tabs__button"}
                  onClick = {()=> this.tabFocus(3)}>
            Metrics</button>]
      }
      { this.props.status != 'withdrawn' &&
          <button className={this.state.currentTab === 4 ? "c-tabs__button--active" : "c-tabs__button"}
                  onClick = {()=> this.tabFocus(4)}>
            Author & Article Info</button>
      }
        </div>
        <div className="c-tabs__content">
          {this.state.currentTab === 1 ? <TabMainComp {...this.props} /> : null}
          {this.state.currentTab === 2 ? <TabSupplementalComp {...this.props} /> : null}
          {this.state.currentTab === 3 ? <TabMetricsComp {...this.props} /> : null}
          {this.state.currentTab === 4 ? <TabAuthorComp {...this.props} /> : null}
          <p><br/></p>
        </div>
      </div>
    )
  }
}

module.exports = TabsComp;
