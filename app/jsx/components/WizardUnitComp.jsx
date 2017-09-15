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
    let unitList = this.state.units ?
        this.state.units.map((u) => {
          return (<li key={u.id}>
                     <a onClick = {(event)=>{
                     event.preventDefault()
                     this.props.goForward(5, {"unitID": u.id, "unitName": u.name})}
                     } href="">{u.name}</a></li>)
        } )
      : null 
    return (
      <Subscriber channel="wiz">
        { wiz => {
            this.fetchUnits(wiz.campusID)
      return(
      <div className="c-wizard__step">
        <header>
          <h1 tabIndex="-1">{wiz.campusName} Deposit</h1>
          <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goBackward()}
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
          Don't see your department? <a href="">Add it to eScholarship here</a>.
        </footer>]
      }
      </div>
      )}}
      </Subscriber>
    )
  }
}

module.exports = WizardUnitComp;
