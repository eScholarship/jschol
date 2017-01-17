// ##### Search Component - With Search Controls ##### //

import React from 'react'
import Form from 'react-router-form'

class CustomRadioInput extends React.Component {
  render() {
    return (
      <input type="radio" id="c-search2__refine-campus" name={this.props.name} value={this.props.value} onClick={this.props.handleRadioSelect}/>
  )}
}

class SearchControls extends React.Component {
  labelCustomRadio(name) {
    return <label htmlFor="c-search_2_refine-campus">{name}</label>
  }

  render() {
    let p = this.props,
        customRadioName = "",
        customRadioLabel = ""
    if (["oru", "series", "monograph_series", "seminar_series", "special"].includes(p.type)) {
       customRadioName = "departments"
       customRadioLabel = "This department"
    }
    if (p.type == 'journal') {
       customRadioName = "journals"
       customRadioLabel = "This Journal"
    }
    if (p.type == 'campus') {
       customRadioName = "campuses"
       customRadioLabel = "This campus"
    }
    return (
    <div className={this.props.refineActive ? "c-search2__refine--active" : "c-search2__refine"}>
      <input type="radio" id="c-search2__refine-eschol" name={customRadioName} value="" onClick={()=>this.props.handleRadioSelect()} defaultChecked={true}/>
      <label htmlFor="c-search2__refine-eschol">All of eScholarship</label>
      {p.unitID ? <CustomRadioInput name={customRadioName}
                                   value={p.unitID}
                                   handleRadioSelect={()=>this.props.handleRadioSelect()} /> : null }
      {p.unitID ? this.labelCustomRadio(customRadioLabel) : null}
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
            <input type="search" id="global-search" name="q" className="c-search2__field" placeholder="Search eScholarship" onFocus={()=> this.setState({refineActive: true})} onBlur={()=> this.setState({refineActive: false})} />
          </div>
          <SearchControls refineActive={this.state.refineActive}
                          handleRadioSelect={()=>this.handleRadioSelect()}
                          type={this.props.type}
                          unitID={this.props.unitID} />
        </div>
        <button type="submit" className="c-search2__submit-button" aria-label="search"></button>
        <button className="c-search2__search-close-button" aria-label="close search field" onClick = {()=>this.props.onClose()}></button>
      </Form>
    )
  }
}

module.exports = SearchComp2;
