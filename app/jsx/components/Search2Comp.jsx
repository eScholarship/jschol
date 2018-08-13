// ##### Search 2 Component - With Search Controls; Used on unit pages  ##### //

import React from 'react'
import Form from 'react-router-form'

class SearchControls extends React.Component {
  render() {
    let p = this.props,
        searchUnit = null;

    if (p.unitID) {
      // Note below: "Department" is too long to fix in the slide-down box, so we have to abbreviate it.
      searchUnit = [
        <input key="r2" type="radio" id="c-search2__refine-campus" name="searchType" value={p.unitID}
               onFocus={this.props.makeActive} onBlur={this.props.makeInactive}/>,
        <label key="l2" htmlFor="c-search2__refine-campus">This {p.label=="Department" ? "Dept." : p.label}</label>,
        <input key="h" type="hidden" name="searchUnitType" value={this.props.searchUnitType} />
      ]
    }

    return (
    <fieldset>
      <legend>Refine Search</legend>
      <div className={this.props.refineActive ? "c-search2__refine--active" : "c-search2__refine"}>

        <input key="r1" type="radio" id="c-search2__refine-eschol" name="searchType" value="eScholarship"
               defaultChecked={true} onFocus={this.props.makeActive} onBlur={this.props.makeInactive}/>
        <label key="l1" htmlFor="c-search2__refine-eschol" >All of eScholarship</label>
        { searchUnit }

      </div>
    </fieldset>
  )}
}

class SearchComp2 extends React.Component {
  state={refineActive: false}
  makeActive = ()=> this.setState({refineActive: true})
  makeInactive = ()=> this.setState({refineActive: false})

  render() {
    let label, searchUnitType;
    if (["series", "monograph_series", "seminar_series", "special"].includes(this.props.type)) {
      label = "Series"
      searchUnitType = "series"
    } else if (this.props.type == "oru") {
      label = "Department"
      searchUnitType = "departments"
    } else if (this.props.type == "journal") {
      label = "Journal"
      searchUnitType = "journals"
    } else if (this.props.type == "campus") {
      label = "Campus"
      searchUnitType = "campuses"
    }

    return (
        <Form to="/search" method="GET" autoComplete="off">
          <div className="c-search2">
            <div className="c-search2__inputs">
              <div className="c-search2__form">
                  <label className="c-search2__label" htmlFor="global-search">Search eScholarship</label>
                  <input type="search" name="q" id="global-search" className="c-search2__field" placeholder="Search" 
                         onFocus={this.makeActive} onBlur={this.makeInactive} autoComplete="off" 
                         autoCapitalize="off" />
              </div>
              <SearchControls refineActive={this.state.refineActive}
                              label={label}
                              makeActive={this.makeActive}
                              makeInactive={this.makeInactive}
                              unitID={this.props.unitID}
                              searchUnitType={searchUnitType} />
            </div>
            <button type="submit" className="c-search2__submit-button" aria-label="search"></button>
            <button type="button" className="c-search2__search-close-button" aria-label="close search field" onClick = {()=>this.props.onClose()}></button>
          </div>
        </Form>
    )
  }
}

module.exports = SearchComp2;
