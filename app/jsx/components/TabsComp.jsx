// ##### Tabs Component ##### //

import React from 'react'
import Breakpoints from '../../js/breakpoints.json'
import Tab1Comp from '../components/Tab1Comp.jsx'
import Tab2Comp from '../components/Tab2Comp.jsx'
import Tab3Comp from '../components/Tab3Comp.jsx'
import Tab4Comp from '../components/Tab4Comp.jsx'
import Tab5Comp from '../components/Tab5Comp.jsx'

class TabsComp extends React.Component {
  state = {currentTab: this.props.currentTab}

  componentWillMount() {
    if (matchMedia) {
      this.mq = matchMedia("(min-width:"+Breakpoints.screen3+")")
      this.mq.addListener(this.widthChange)
      this.widthChange()
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({currentTab: nextProps.currentTab})
    window.scrollTo(0, 0)
  }

  widthChange = ()=> {
    this.setState({isOpen: this.mq.matches})
  }

  render() {
    return (
      <div className="c-tabs">
        <div className="c-tabs__main-list">
          <button className={this.state.currentTab === 1 ? "c-tabs__button--active" : "c-tabs__button"} onClick = {()=> this.setState({currentTab: 1})}>Main Content</button>
          <button className={this.state.currentTab === 2 ? "c-tabs__button--active" : "c-tabs__button"} onClick = {()=> this.setState({currentTab: 2})}>Supplemental material</button>
          <details open={this.state.isOpen ? "open" : ""} className="c-tabs__sub-list">
            <summary>...</summary>
            <div className="c-tabs__details-buttons">
              <button className={this.state.currentTab === 3 ? "c-tabs__button--active" : "c-tabs__button"} onClick = {()=> this.setState({currentTab: 3})}>Metrics</button>
              <button className={this.state.currentTab === 4 ? "c-tabs__button--active" : "c-tabs__button"} onClick = {()=> this.setState({currentTab: 4})}>Author & Article Info</button>
              <button className={this.state.currentTab === 5 ? "c-tabs__button--active" : "c-tabs__button"} onClick = {()=> this.setState({currentTab: 5})}>Comments (2)</button>
            </div>
          </details>
        </div>
        <div className="c-tabs__panel">
          {this.state.currentTab === 1 ? <Tab1Comp {...this.props} /> : null}
          {this.state.currentTab === 2 ? <Tab2Comp {...this.props} /> : null}
          {this.state.currentTab === 3 ? <Tab3Comp {...this.props} /> : null}
          {this.state.currentTab === 4 ? <Tab4Comp {...this.props} /> : null}
          {this.state.currentTab === 5 ? <Tab5Comp {...this.props} /> : null}
        </div>
      </div>
    )
  }
}

module.exports = TabsComp;
