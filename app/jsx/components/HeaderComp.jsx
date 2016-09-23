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
        { this.props.level && this.renderLocalHeader() }
      </div>
    )
  }

  renderLocalHeader() {
    return (
      <div>
        <h2>Unit Banner Placeholder</h2>
        <div className="o-input__droplist">
          <select name="" id="">
            <option value="lbnl" selected={"lbnl" == this.props.campusID}>Lawrence Berkeley National Laboratory</option>
            <option value="ucb" selected={"ucb" == this.props.campusID}>UC Berkeley</option>
            <option value="ucd" selected={"ucd" == this.props.campusID}>UC Davis</option>
            <option value="uci" selected={"uci" == this.props.campusID}>UC Irvine</option>
            <option value="ucla" selected={"ucla" == this.props.campusID}>UCLA</option>
            <option value="ucm" selected={"ucm" == this.props.campusID}>UC Merced</option>
            <option value="ucr" selected={"ucr" == this.props.campusID}>UC Riverside</option>
            <option value="ucsd" selected={"ucsd" == this.props.campusID}>UC San Diego</option>
            <option value="ucsf" selected={"ucsf" == this.props.campusID}>UC San Francisco</option>
            <option value="ucsb" selected={"ucsb" == this.props.campusID}>UC Santa Barbara</option>
            <option value="ucsc" selected={"ucsc" == this.props.campusID}>UC Santa Cruz</option>
            <option value="ucop" selected={"ucop" == this.props.campusID}>UC Office of the President</option>
            <option value="ucpress" selected={"ucpress" == this.props.campusID}>UC Press</option>
          </select>   Publications in eScholarship:   16,780<br/>
        </div>
      </div>
    )
  }
}

module.exports = HeaderComp;
