// ##### Header Component ##### //

import React from 'react'
import { browserHistory } from 'react-router'
import SearchComp from '../components/SearchComp.jsx'

class HeaderComp extends React.Component {
  constructor(props){
    super(props)
    this.state = {searchActive: false}
  }


  changeCampus(event) {
    let path = "/unit/" + event.target.value
    browserHistory.push(path)
  }

  render() {
    return (
      <div>
        <div className="c-header">
          <div className="c-header__logosearch">
            <a href="/">
              <img src="/images/logo_escholarship.svg" alt="escholarship"/>
            </a>	
            <div className={this.state.searchActive ? "c-header__search--active" : "c-header__search"}>
              <SearchComp isJournal={this.props.isJournal} onClose = {()=>this.setState({searchActive: false})} />
            </div>
            <button className="c-header__search-open-button" aria-label="open search navigation" onClick = {()=> this.setState({searchActive: true})}></button>
          </div>
          <div className="c-header__deposit">
            <button className="c-header__deposit-button">Deposit/Publish</button>
          </div>
        </div>
        { this.props.level && this.props.unit_id != 'root' && this.renderLocalHeader() }
      </div>
    )
  }

  renderLocalHeader() {
    // Temporary styles till we get Joel's work
    let rowStyle = { display: 'table', padding: "5px 0px" };
    let leftStyle = { display: 'table-cell', width: '250px', padding: "0px 10px" };
    let centerStyle = { display: 'table-cell', width: '600px', padding: "0px 10px", border: '1px solid black' };
    let rightStyle = { display: 'table-cell', width: '200px', padding: "0px 10px" };
    var campusSelector = this.props.campuses.map(function(c, i) {
        return <option key={i} value={c[0]} disabled={c[0] == "" ? "true" : null}>{c[1]}</option>
      }),
    campusID = this.props.campusID ? this.props.campusID : ""
    return (
      <div style={rowStyle}>
        <div style={leftStyle}>
          <div className="o-input__droplist">
            <select name="" id="" onChange={this.changeCampus} value={campusID}>
              {campusSelector}
            </select>
          </div>
        </div>
        <div style={centerStyle}>
          <h2>Unit Banner Placeholder</h2>
        </div>
        <div style={rightStyle}>
          <button>Submit</button>
          <button>Manage submissions</button>
        </div>
      </div>
    )
  }
}

module.exports = HeaderComp;
