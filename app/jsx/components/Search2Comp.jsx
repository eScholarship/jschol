// ##### Search Component - With Search Controls ##### //

import React from 'react'
import Form from 'react-router-form'

class CustomLabel extends React.Component {
  render() { return (
    <label htmlFor="c-search_2_refine-campus">{this.props.name}</label>
  )}
}

class SearchControls extends React.Component {
  state = {
    // The ID of the unit or item to be searched on
    search_id: this.props.id
  }

  parentId = this.parentId.bind(this)

  handleRadioSelect(){
    this.props.handleRadioSelect()
  }

  componentWillMount() {
    if (this.props.type.includes("series") || this.props.type.includes("special")) {
      this.setState({search_id: this.parentId()})
    }
  }

  // Used for series and special where we need to grab the parent Unit ID. Not used with other units or items. 
  parentId() {
    return this.props.parents ? this.props.parents[0] : null 
  }

  render() {
    return (
    <div className={this.props.refineActive ? "c-search2__refine--active" : "c-search2__refine"}>
      <input type="radio" name="search-refine" id="c-search2__refine-eschol" onClick = {this.handleRadioSelect.bind(this)} defaultChecked={true}/>
      <label htmlFor="c-search2__refine-eschol">All of eScholarship</label>
      <input type="radio" name="search-refine" value={this.state.search_id} id="c-search2__refine-campus" onClick={this.handleRadioSelect.bind(this)}/>
      {['oru', 'series', 'monograph_series', 'seminar_series', 'special'].includes(this.props.type)
        && <CustomLabel name="This department" />}
      {this.props.type == 'campus' && <CustomLabel name="This campus" />}
      {this.props.type == 'journal' && <CustomLabel name="This journal" />}
    </div>
  )}
}

class SearchComp2 extends React.Component {
  constructor(props){
    super(props)
    this.state = {refineActive: false}
  }

  handleRadioSelect() {
    this.setState({refineActive: false})
  }

  render() {
    return (
      <Form to='/search' method="GET" className="c-search2" onSubmit = {()=> this.setState({refineActive: false})}>
        <div className="c-search2__inputs">
          <div className="c-search2__form">
            <label className="c-search2__label" htmlFor="global-search">Search eScholarship</label>
            <input type="search" id="global-search" name="q" className="c-search2__field" placeholder="Search eScholarship" onFocus = {()=> this.setState({refineActive: true})} />
          </div>
          <SearchControls refineActive={this.state.refineActive}
                          handleRadioSelect={this.handleRadioSelect.bind(this)}
                          id={this.props.id}
                          type={this.props.type}
                          parents={this.props.parents} />
        </div>
        <button type="submit" className="c-search2__submit-button" aria-label="search"></button>
        <button className="c-search2__search-close-button" aria-label="close search field" onClick = {()=>this.props.onClose()}></button>
      </Form>
    )
  }
}

module.exports = SearchComp2;
