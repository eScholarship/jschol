// ##### Search Component ##### //

import React from 'react'
import Form from 'react-router-form'

class SearchComp2 extends React.Component {
  constructor(props){
    super(props)
    this.state = {refineActive: false}
  }
  render() {
    return (
      <Form to='/search' method="GET" className="c-search2" onSubmit = {()=> this.setState({refineActive: false})}>
        <div className="c-search2__inputs">
          <div className="c-search2__form">
            <label className="c-search2__label" htmlFor="global-search">Search eScholarship</label>
            <input type="search" id="global-search" name="q" className="c-search2__field" placeholder="Search eScholarship" onFocus = {()=> this.setState({refineActive: true})}/>
          </div>
          <div className={this.state.refineActive ? "c-search2__refine--active" : "c-search2__refine"}>
            <input type="radio" name="search-refine" id="c-search2__refine-eschol" onClick = {()=> this.setState({refineActive: false})} defaultChecked={true}/>
            <label htmlFor="c-search2__refine-eschol">All of eScholarship</label>
            <input type="radio" name="search-refine" id="c-search2__refine-campus" onClick = {()=> this.setState({refineActive: false})}/>
            {this.props.isJournal ? <label htmlFor="c-search_2_refine-campus">This journal</label> : <label htmlFor="c-search2__refine-campus">This campus</label>}
          </div>
        </div>
        <button type="submit" className="c-search2__submit-button" aria-label="search"></button>
        <button className="c-search2__search-close-button" aria-label="close search field" onClick = {()=>this.props.onClose()}></button>
      </Form>
    )
  }
}

module.exports = SearchComp2;
