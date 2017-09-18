// ##### Deposit Wizard - [4] Unit (ORU) Component ##### //

import React from 'react'
import { Subscriber } from 'react-broadcast'

class WizardUnitComp extends React.Component {
  state = {fetchingData: true,
           units: null        }

  currentCampus = null

  fetchUnits = (campusID) => {
    if (campusID && campusID != this.currentCampus && !["eScholarship", "root"].includes(campusID)) {
      this.currentCampus = campusID
      $.getJSON(`/api/wizardlyORUs/${campusID}`).done((units) => {
        this.setState({ units: units, fetchingData: false })
      }).fail((jqxhr, textStatus, err)=> {
        // ToDo: Create an error field to display any errors
        this.setState({ fetchingData: false })
      })
    }
  }

  render() {
    let unitList = (this.state.units && this.state.units.length > 0) ?
        this.state.units.map((u) => {
          if (u.directSubmit && u.directSubmit == "moribund") {
            return (<li key={u.id}>
                      <a onClick = {(event)=>{
                      event.preventDefault()
                      this.props.goForward(6, {'arg': '6_moribund', 'type': 'unit', 'unitID': u.id, 'unitName': u.name})}
                      } href="">{u.name}</a></li>)
          } else if (u.directSubmit && ["hide", "disabled"].includes(u.directSubmit)) {
            return (<li key={u.id}>
                      <a onClick = {(event)=>{
                      event.preventDefault()
                      this.props.goForward(6, {'arg': '6_disabled', 'type': 'unit', 'unitID': u.id, 'unitName': u.name})}
                      } href="">{u.name}</a></li>)
          } else {
            return (<li key={u.id}>
                     <a onClick = {(event)=>{
                     event.preventDefault()
                     this.props.goForward(5, {"unitID": u.id, "unitName": u.name})}
                     } href="">{u.name}</a></li>)
          }
        } )
      : null
    return (
      <Subscriber channel="wiz">
        { wiz => {
            this.fetchUnits(wiz.campusID)
            let prevStep = 3    // where other faculty go
            // Student is not asked to select type of material (always skips step 3)
            if (wiz.arg && wiz.arg.includes("student")) {
              // If launched from a campus, go back to step one
              prevStep = (wiz.launchedFromRoot) ? 2 : 1
            }
      return(
      <div className="c-wizard__step">
        <header>
          <h1 tabIndex="-1">{wiz.campusName} Deposit</h1>
          <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goBackward(prevStep)}
          } href=""><span>Go back</span></a>
          <button onClick={this.props.closeModal}><span>Close</span></button>
        </header>
      {this.state.fetchingData ?
        <div className="c-wizard__heading">
          Loading... 
        </div>
      :
       [<div key="0" className="c-wizard__heading">
          What is your departmental affiliation?
        </div>,
        <ul key="1" className="c-wizard__list">
          {unitList}
        </ul>,
        <footer key="2">
          Don't see your department? <a href="https://help.escholarship.org/support/solutions/articles/9000131086-request-a-new-unit">Add it to eScholarship here</a>.
        </footer>]
      }
      </div>
      )}}
      </Subscriber>
    )
  }
}

module.exports = WizardUnitComp;
