// ##### Tabs v.2 Component ##### //

import React from 'react'
import TabMainComp from '../components/TabMainComp.jsx'
import TabSupplementalComp from '../components/TabSupplementalComp.jsx'
import TabMetricsComp from '../components/TabMetricsComp.jsx'
import TabAuthorComp from '../components/TabAuthorComp.jsx'
import TabCommentsComp from '../components/TabCommentsComp.jsx'
import $ from 'jquery'

class Tabs2Comp extends React.Component {
  constructor(props){
    super(props)
    this.state = {currentTab: 1, moreTabs: false}
  }
  tabFocus(tabNumber) {
    // For keyboard users, jump to heading within the tab.
    // setTimeout(()=>$(".c-tabcontent__main-heading").focus(), 0)
    this.setState({currentTab: tabNumber})
  }
  render() {
    return (
      <div className={this.state.moreTabs ? "c-tabs2--show-all" : "c-tabs2"}>
        <details className="c-tabs2__details">
          <summary className={this.state.currentTab === 1 ? "c-tabs2__summary--active" : "c-tabs2__summary"} onClick = {()=> this.tabFocus(1)}>Main Content</summary>
          <div className="c-tabs2__tabpanel">
            {this.state.currentTab === 1 ? <TabMainComp /> : null}
          </div>
        </details>
        <details className="c-tabs2__details">
          <summary className={this.state.currentTab === 2 ? "c-tabs2__summary--active" : "c-tabs2__summary"} onClick = {()=> this.tabFocus(2)}>Supplemental Material</summary>
          <div className="c-tabs2__tabpanel">
            {this.state.currentTab === 2 ? <TabSupplementalComp /> : null}
          </div>
        </details>
        <details className="c-tabs2__details">
          <summary className={this.state.currentTab === 3 ? "c-tabs2__summary--active" : "c-tabs2__summary"} onClick = {()=> this.tabFocus(3)}>Metrics</summary>
          <div className="c-tabs2__tabpanel">
            {this.state.currentTab === 3 ? <TabMetricsComp /> : null}
          </div>
        </details>
        <details className="c-tabs2__details">
          <summary className={this.state.currentTab === 4 ? "c-tabs2__summary--active" : "c-tabs2__summary"} onClick = {()=> this.tabFocus(4)}>Author & Article Info</summary>
          <div className="c-tabs2__tabpanel">
            {this.state.currentTab === 4 ? <TabAuthorComp /> : null}
          </div>
        </details>
        <details className="c-tabs2__details">
          <summary className={this.state.currentTab === 5 ? "c-tabs2__summary--active" : "c-tabs2__summary"} onClick = {()=> this.tabFocus(5)}>Comments</summary>
          <div className="c-tabs2__tabpanel">
            {this.state.currentTab === 5 ? <TabCommentsComp /> : null}
          </div>
        </details>
        <button className="c-tabs2__button" onClick = {()=> this.setState({moreTabs: !this.state.moreTabs})} aria-label="Show all tabs">...</button>
      </div>
    )
  }
}

export default Tabs2Comp;
