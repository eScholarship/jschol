// ##### Search Component - With Search Controls ##### //

import React from 'react'
import Form from 'react-router-form'

class SearchControls extends React.Component {
  constructor(props) {
    super(props)
    // The ID of the unit or item to be searched on
    this.state = {search_id: this.props.id}
    this.parentId = this.parentId.bind(this)
    this.onPropsSetOrChange = this.onPropsSetOrChange.bind(this)
  }

  // Used for series and special where we need to grab the parent Unit ID. Not used with other units or items. 
  parentId() {
    return this.props.parents ? this.props.parents[0] : null 
  }

  handleRadioSelect(){
    this.props.handleRadioSelect()
  }

  componentWillMount() {
    this.onPropsSetOrChange(this.props)
  }

  componentWillReceiveProps(props) {
    this.onPropsSetOrChange(props)
  }

  onPropsSetOrChange(props) {
    if (props.type.includes("series") || props.type.includes("special")) {
      this.setState({search_id: this.parentId()})
    }
    ['oru', 'series', 'monograph_series', 'seminar_series', 'special'].includes(props.type) &&
       this.setState({customRadioName: "departments",
                      customRadioLabel: "This department"})
    props.type == 'campus' && 
       this.setState({customRadioName: "campuses",
                      customRadioLabel: "This campus"})
    props.type == 'journal' &&
       this.setState({customRadioName: "journals",
                      customRadioLabel: "This Journal"})
  }

  render() {
    return (
    <div className={this.props.refineActive ? "c-search2__refine--active" : "c-search2__refine"}>
      <input type="radio" id="c-search2__refine-eschol" name={this.state.customRadioName} onClick = {this.handleRadioSelect.bind(this)} defaultChecked={true}/>
      <label htmlFor="c-search2__refine-eschol">All of eScholarship</label>
      <input type="radio" id="c-search2__refine-campus" name={this.state.customRadioName} value={this.state.search_id} onClick={this.handleRadioSelect.bind(this)}/>
      <label htmlFor="c-search_2_refine-campus">{this.state.customRadioLabel}</label>
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
