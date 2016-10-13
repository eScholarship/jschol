
import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import { HeaderComp, NavComp, BreadcrumbComp, ItemMainComp, ItemSupplComp, ItemMetricsComp, ItemAuthArtComp, ItemCommentsComp } from '../components/AllComponents.jsx'

class ItemPage extends PageBase
{
  constructor(props) {
    super(props)
    this.state.currentTab = Number(props.currentTab)
  }

  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL(props) {
    return "/api/item/" + props.params.itemID
  }

  changeTab(tab_id) {
    this.setState({currentTab: tab_id})
  }

  renderData(data) { 
    // Temporary styles till we get Joel's work
    let rowStyle = {
      display: 'table'
    };
    let leftStyle = {
      display: 'table-cell',
      width: '850px',
      padding: "0px 10px"
    };
    let rightStyle = {
      display: 'table-cell',
      width: '200px',
      padding: "0 0 40px 0"
    };
    let p = data 
    return(
      <div>
        <HeaderComp level="item"
                    campusID={data.campusID}
                    campusName={data.campusName}
                    campuses={data.campuses}
                    unit_id={data.id} />
        <NavComp level="item"
                 campusID={data.campusID} />
        <BreadcrumbComp array={data.breadcrumb} />
        <div style={rowStyle}>
          <div style={leftStyle}>
            <ItemTabbed
              {...p}
              currentTab={this.state.currentTab}  // overwrite props.currentTab
              changeTab={this.changeTab.bind(this)}
            />
          </div>
          <div style={rightStyle}>
            <ItemLinkColumn 
              changeTab={this.changeTab.bind(this)}
              {...p}
            />
          </div>
        </div>
      </div>
    )
  }

}
ItemPage.defaultProps = { currentTab: 1 };

{/* Tabbed Navigation courtesy Trey Piepmeier http://codepen.io/trey/post/tabbed-navigation-react*/}
class ItemTabbed extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      tabList: [ 
        { 'id': 1, 'name': 'Main content', 'url': '#main' },
        { 'id': 2, 'name': 'Data & media', 'url': '#suppl' },
        { 'id': 3, 'name': 'Metrics', 'url': '#metrics' },
        { 'id': 4, 'name': 'Author & article info', 'url': '#authorarticle' },
        { 'id': 5, 'name': 'Comments', 'url': '#comments' } ]
    }
  }

  render() { return(
    <div>
      <Tabs
        currentTab={this.props.currentTab}
        tabList={this.state.tabList}
        changeTab={this.props.changeTab}
      />
      <TabSwitch {...this.props}/>
    </div>
  )}
}

class Tabs extends React.Component {
  handleClick(tab){
    this.props.changeTab(tab.id)
  }
  
  render() { return( <ul className="nav nav-tabs">
    {this.props.tabList.map(function(tab) {
      return (
        <Tab
          handleClick={this.handleClick.bind(this, tab)}
          key={tab.id}
          url={tab.url}
          name={tab.name}
          isCurrent={(this.props.currentTab === tab.id)}
         />
      )
    }.bind(this))}
    </ul>
  )}
}

class Tab extends React.Component {
  handleClick(e){
    e.preventDefault()
    this.props.handleClick()
  }
  
  render() { return(
    <li className="nav-item">
      <a className={this.props.isCurrent ? 'current' : null} 
         onClick={this.handleClick.bind(this)}
         href={this.props.url}>{this.props.name}
      </a>
    </li>
  )}
}

class TabSwitch extends React.Component {
  render() { return(
    <div>
      {this.props.currentTab === 1 ? <ItemMainComp {...this.props}/> : null }
      {this.props.currentTab === 2 ? <ItemSupplComp {...this.props}/> : null}
      {this.props.currentTab === 3 ? <ItemMetricsComp {...this.props}/> : null}
      {this.props.currentTab === 4 ? <ItemAuthArtComp {...this.props}/> : null}
      {this.props.currentTab === 5 ? <ItemCommentsComp {...this.props}/> : null}
    </div>
  )}
}

class ItemLinkColumn extends React.Component {
  handleClick(tab_id) {  
    this.props.changeTab(tab_id)
  }

  render() { 
    let p = this.props
    return(
      <div>
        <div className="card card-block">
          <h4 className="card-title">Download</h4>
          Article: PDF | ePub | HTML<br/>
          Image<br/>
          Media<br/>
          <a href="#"
             onClick={this.handleClick.bind(this, 2)}
             className="card-link">
            more...
          </a>
        </div> 
        <div className="card card-block">
          <h4 className="card-title">Buy</h4>
          <a href="#" className="card-link">Link</a>
        </div> 
        <div className="card card-block">
          <h4 className="card-title">Share</h4>
          <a href="#" className="card-link">Link</a>
        </div>
        <div className="card card-block">
          <h4 className="card-title">Jump to:</h4>
          <a href="#" onClick={this.handleClick.bind(this, 1)} className="card-link">Abstract</a><br/>
          <a href="#" onClick={this.handleClick.bind(this, 1)} className="card-link">Main Text</a><br/>
          <a href="#" className="card-link">References</a><br/>
          <a href="#" className="card-link">Author response</a><br/>
          <a href="#" onClick={this.handleClick.bind(this, 2)} className="card-link">Supplemental Material</a><br/>
          <a href="#" onClick={this.handleClick.bind(this, 3)} className="card-link">Metrics</a><br/>
          <a href="#" onClick={this.handleClick.bind(this, 4)} className="card-link">Article & author info</a><br/>
          <a href="#" onClick={this.handleClick.bind(this, 5)} className="card-link">Comments</a>

        </div>
        <div className="card card-block">
          <h4 className="card-title">Related Items</h4>
          <a href="#" className="card-link">Link</a>
        </div>
      </div>
    )
  }
}

module.exports = ItemPage;
