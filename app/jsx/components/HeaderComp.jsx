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
        { this.props.level && this.renderLocalHeader(this.props.level) }
      </div>
    )
  }

  renderLocalHeader() {
    return (
      <div>
        <h2>Unit Banner Placeholder</h2>
        <div className="o-input__droplist">
          <select name="" id="">
            <option value="">UC Berkeley</option>
            <option value="">UC Davis</option>
            <option value="">UC Irvine</option>
            <option value="">UCLA</option>
            <option value="">UC Merced</option>
            <option value="">UC Riverside</option>
            <option value="">UC San Diego</option>
            <option value="">UC San Francisco</option>
            <option value="">UC Santa Barbara</option>
            <option value="">UC Santa Cruz</option>
            <option value="">UC Office of the President</option>
            <option value="">UC Press</option>
          </select>   Publications in eScholarship:   16,780<br/>
        </div>
      </div>
    )
  }
}

module.exports = HeaderComp;
