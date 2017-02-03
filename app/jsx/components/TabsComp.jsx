// ##### Tabs Component ##### //

import React from 'react'
import TabContent1Comp from '../components/TabContent1Comp.jsx'
import TabContent2Comp from '../components/TabContent2Comp.jsx'
import TabContent3Comp from '../components/TabContent3Comp.jsx'
import TabContent4Comp from '../components/TabContent4Comp.jsx'
import TabContent5Comp from '../components/TabContent5Comp.jsx'

class TabsComp extends React.Component {
  state = {currentTab: this.props.currentTab, moreTabs: false}

  componentWillReceiveProps(nextProps) {
    this.setState({currentTab: nextProps.currentTab})
    window.scrollTo(0, 0)
  }

  render() {
    return (
      <div className="c-tabs">
        <div className={this.state.moreTabs ? "c-tabs__tabs--show-all" : "c-tabs__tabs"}>
          <button className="c-tabs__button-more" onClick = {()=> this.setState({moreTabs: !this.state.moreTabs})} aria-label="Show all tabs">...</button>
          <button className={this.state.currentTab === 1 ? "c-tabs__button--active" : "c-tabs__button"} onClick = {()=> this.setState({currentTab: 1})}>Main Content</button>
          <button className={this.state.currentTab === 2 ? "c-tabs__button--active" : "c-tabs__button"} onClick = {()=> this.setState({currentTab: 2})}>Supplemental material</button>
          <button className={this.state.currentTab === 3 ? "c-tabs__button--active" : "c-tabs__button"} onClick = {()=> this.setState({currentTab: 3})}>Metrics</button>
          <button className={this.state.currentTab === 4 ? "c-tabs__button--active" : "c-tabs__button"} onClick = {()=> this.setState({currentTab: 4})}>Author & Article Info</button>
          <button className={this.state.currentTab === 5 ? "c-tabs__button--active" : "c-tabs__button"} onClick = {()=> this.setState({currentTab: 5})}>Comments (2)</button>
        </div>
        <div className="c-tabs__content">
          {this.state.currentTab === 1 ? <TabContent1Comp {...this.props} /> : null}
          {this.state.currentTab === 2 ? <TabContent2Comp {...this.props} /> : null}
          {this.state.currentTab === 3 ? <TabContent3Comp {...this.props} /> : null}
          {this.state.currentTab === 4 ? <TabContent4Comp {...this.props} /> : null}
          {this.state.currentTab === 5 ? <TabContent5Comp {...this.props} /> : null}
        </div>
      </div>
    )
  }
}

module.exports = TabsComp;
