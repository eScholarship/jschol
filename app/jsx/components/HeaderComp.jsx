// ##### Header Component ##### //

import React from 'react'
import SearchObj from '../objects/SearchObj.jsx'

class HeaderComp extends React.Component {
  constructor(props){
    super(props)
    this.state = {searchActive: false}
  }

  render() {
    return (
      <div>
        <div className="c-header">
          <div className="c-header__logosearch">
            <a href="">
              <img src="/images/logo_escholarship.svg" alt="escholarship"/>
            </a>	
            <div className={this.state.searchActive ? "c-header__search--active" : "c-header__search"}>
              <SearchObj onClose = {()=>this.setState({searchActive: false})} />
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
    // onChange={this.handleCampusChange}
    return (
      <div>
        <h2>Unit Banner Placeholder</h2>
        <div className="o-input__droplist">
          <select name="" id="" value={this.props.campusID}>
            <option value="lbnl">Lawrence Berkeley National Laboratory</option>
            <option value="ucb">UC Berkeley</option>
            <option value="ucd">UC Davis</option>
            <option value="uci">UC Irvine</option>
            <option value="ucla">UCLA</option>
            <option value="ucm">UC Merced</option>
            <option value="ucr">UC Riverside</option>
            <option value="ucsd">UC San Diego</option>
            <option value="ucsf">UC San Francisco</option>
            <option value="ucsb">UC Santa Barbara</option>
            <option value="ucsc">UC Santa Cruz</option>
            <option value="ucop">UC Office of the President</option>
            <option value="ucpress">UC Press</option>
          </select>   Publications in eScholarship:   16,780<br/>
        </div>
      </div>
    )
  }
}

module.exports = HeaderComp;
