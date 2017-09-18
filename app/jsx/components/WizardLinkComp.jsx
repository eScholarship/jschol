// ##### Deposit Wizard - [6] Link Component ##### //

import React from 'react'
import { Subscriber } from 'react-broadcast'

const SUPPORT_LINK = "http://help.escholarship.org/support/tickets/new"

class WizardLinkComp extends React.Component {
  render() {
    return (
      <Subscriber channel="wiz">
        { wiz => {
          let name = (wiz.type == "series") ? wiz.seriesName : wiz.unitName
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
  {(() => {
    switch(wiz.arg) {
      case "6_senate":
       return [<div key="0" className="c-wizard__heading">
          UC Publication Management
        </div>,
        <div key="1" className="c-wizard__message">
          <p>Faculty use the UC Publication Management system for all eScholarship deposits– including to claim and deposit publications in compliance with the <a href="http://osc.universityofcalifornia.edu/open-access-policy">UC Academic Senate faculty Open Access Policy</a>.</p>
          <a href="https://oapolicy.universityofcalifornia.edu">Go to UC Publication Management</a>
        </div>,
        <footer key="2">
          Alternately, you may choose to wait for the system to automatically detect your new publication and send you a deposit link via email.
        </footer>]
      case "6_dash":
       return [<div key="0" className="c-wizard__heading">
          Deposit your data in Dash 
        </div>,
        <div key="1" className="c-wizard__message">
          <p>{wiz.campusName} faculty, students and staff can take advantage of Dash, a specialized data publication and preservation service.</p>
          <a href="">Go to {wiz.campusName} Dash</a>
        </div>,
        <footer key="2"></footer>]
      case "6_sorry":
        return [<div key="0" className="c-wizard__heading">
          We&#8217;re sorry... 
        </div>,
        <div key="1" className="c-wizard__message">
          <p>eScholarship currently accepts deposits from University of California affiliated faculty, researchers, staff and students only.</p>
          <p>Check the <a href="http://www.opendoar.org/">Directory of Open Access Repositories</a> to find out if an Open Access repository is available at your institution.</p>
        </div>,
        <footer key="2"></footer>]
      case "6_moribund":
        return [<div key="0" className="c-wizard__heading">
          We&#8217;re sorry... 
        </div>,
        <div key="1" className="c-wizard__message">
          <p>This {wiz.type} <b>({name})</b> is no longer active and is not accepting new deposits.</p>
          <p>Check the <a href="http://www.opendoar.org/">Directory of Open Access Repositories</a> to find out if an Open Access repository is available at your institution.</p>
        </div>,
        <footer key="2">
          If you are affiliated with this unit and interested in re-activating this series <a href={SUPPORT_LINK}>contact eScholarship support</a>.
        </footer>]
      case "6_disabled":
        return [<div key="0" className="c-wizard__heading">
          We&#8217;re sorry... 
        </div>,
        <div key="1" className="c-wizard__message">
          <p>This {wiz.type} <b>({name})</b> is not currently accepting new deposits.</p>
          <p>You may find more information on the <a href={"/uc/"+wiz.unitID}>unit’s page</a>.</p>
        </div>,
        <footer key="2"></footer>]
      default: 
        return [<div key="0" className="c-wizard__heading">
          Error rendering page... 
          {wiz.arg && <span>Template variable {wiz.arg} does not compute</span>}
        </div>,
        <div key="1" className="c-wizard__message">
          <p>Please <a href={SUPPORT_LINK}>contact eScholarship</a> and report this error, thank you.</p>
        </div>,
        <footer key="2"></footer>]
        }
  })()}
      </div>
      )}}
      </Subscriber>
    )
  }
}

module.exports = WizardLinkComp;
