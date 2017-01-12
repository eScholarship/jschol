// ##### Search Component - With Search Controls ##### //

import React from 'react'
import Form from 'react-router-form'
import $ from 'jquery'

class SearchControls extends React.Component {
  constructor(props) {
    super(props)
    this.onPropsSetOrChange = this.onPropsSetOrChange.bind(this, this.props)
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
    // console.log(this.props.type)
    (["oru", "series", "monograph_series", "seminar_series", "special"].includes(props.type)) &&
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
      <input type="radio" id="c-search2__refine-eschol" name={this.state.customRadioName} value="" onClick = {this.handleRadioSelect.bind(this)} defaultChecked={true}/>
      <label htmlFor="c-search2__refine-eschol">All of eScholarship</label>
      <input type="radio" id="c-search2__refine-campus" name={this.state.customRadioName} value={this.props.unitID} onClick={this.handleRadioSelect.bind(this)}/>
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

  removeGlobal() {
    $("#c-search2__refine-eschol").remove
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
                          type={this.props.type}
                          unitID={this.props.unitID} />
        </div>
        <button type="submit" className="c-search2__submit-button" aria-label="search" onClick={()=>this.removeGlobal()}></button>
        <button className="c-search2__search-close-button" aria-label="close search field" onClick = {()=>this.props.onClose()}></button>
      </Form>
    )
  }
}

module.exports = SearchComp2;
