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
              <SearchComp onClose = {()=>this.setState({searchActive: false})} />
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
    var campusSelector = this.props.campuses.map(function(c, i) {
      return <option key={i} value={c[0]}>{c[1]}</option>
    })
    return (
      <div>
        <h2>Unit Banner Placeholder</h2>
        <div className="o-input__droplist">
          <select name="" id="" onChange={this.changeCampus} value={this.props.campusID}>
            {campusSelector}
          </select>   Publications in eScholarship:   16,780<br/>
        </div>
      </div>
    )
  }
}

module.exports = HeaderComp;
