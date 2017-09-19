// ##### Deposit Wizard - [5] Series Component ##### //

import React from 'react'
import { Subscriber } from 'react-broadcast'

class WizardSeriesComp extends React.Component {
  state = {fetchingData: true,
           series: null    }

  currentSeries = null

  fetchSeries = (unitID) => {
    if (unitID && unitID != this.currentSeries && !["eScholarship", "root"].includes(unitID)) {
      this.currentSeries = unitID
      $.getJSON(`/api/wizardlySeries/${unitID}`).done((series) => {
        this.setState({ series: series, fetchingData: false })
      }).fail((jqxhr, textStatus, err)=> {
        // ToDo: Create an error field to display any errors
        this.setState({ fetchingData: false })
      })
    }
  }

  render() {
    let seriesList = (this.state.series && this.state.series.length > 0) ?
        this.state.series.map((u) => {
          if (u.directSubmit && u.directSubmit == "moribund") {
            return (<li key={u.id}>
                      <a onClick = {(event)=>{
                      event.preventDefault()
                      this.props.goForward(6, {'arg': '6_moribund', 'type': 'series', 'seriesName': u.name})}
                      } href="">{u.name}</a></li>)
          } else if (u.directSubmit && ["hide", "disabled"].includes(u.directSubmit)) {
            return (<li key={u.id}>
                      <a onClick = {(event)=>{
                      event.preventDefault()
                      this.props.goForward(6, {'arg': '6_disabled', 'type': 'series', 'seriesName': u.name})}
                      } href="">{u.name}</a></li>)
          } else {
            return (<li key={u.id}>
                      <a href={this.props.subi_link+u.id}>{u.name}</a></li>)
          }
        } )
      : null
    // Deal with series list of zero or one 
    if (!this.state.fetchingData && this.state.series) {
      if (this.state.series.length == 1) {
        // Bypass this component and just go direct to subi
        this.props.closeModal()
        window.location = this.props.subi_link+this.state.series[0].id
      }
      if (this.state.series.length == 0) {
        // HACK: This screen should never comecuz any unit's with zero series should
        //       themselves should be tagged as 'disabled', but keeping this here as a backup
        seriesList = (<li><a onClick = {(event)=>{
                  event.preventDefault()
                  this.props.goForward(6, {'arg': '6_disabled', 'seriesName': "NONE"})}
                  } href="">...No Series Found...</a></li>)
      }
    }
    return (
      <Subscriber channel="wiz">
        { wiz => {
            this.fetchSeries(wiz.unitID)
      return (
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
          Into which <b>{wiz.unitName}</b> series would you like to deposit your work?
        </div>,
        <ul key="1" className="c-wizard__list">
          {seriesList}
        </ul>,
        <footer key="2">
          We use these questions to direct you to the right place to deposit your materials.
        </footer>]
      }
      </div>
      )}}
      </Subscriber>
    )
  }
}

module.exports = WizardSeriesComp;
