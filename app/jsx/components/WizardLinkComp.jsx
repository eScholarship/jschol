// ##### Deposit Wizard - [6] Link Component ##### //

import React from 'react'
import Contexts from '../contexts.jsx'

const SUPPORT_LINK = "https://help.escholarship.org/support/tickets/new"

class WrapperComp extends React.Component {
  render = () =>
    <div className="c-wizard__step">
      <header>
        <h1 tabIndex="-1">{this.props.campusName} Deposit</h1>
        <a onClick = {(event)=>{
          event.preventDefault()
          this.props.goBackward()}
        } href=""><span>Go back</span></a>
        <button onClick={this.props.closeModal}><span>Close</span></button>
      </header>
      {this.props.children ? this.props.children :
         [<p key="0">Template variable does not compute</p>,
          <p key="1">Please <a href={SUPPORT_LINK}>contact eScholarship</a> and report this error, thank you.</p>,
          <footer key="2"></footer>] }
    </div>
}

class WizardLinkComp extends React.Component {
  render() {
    // 'arg' property used to define user logic, or it will be the DASH link
    return (
      <Contexts.Wiz.Consumer>
        { wiz => {
          let name = (wiz.type == "series") ? wiz.seriesName : wiz.unitName
      return (
      <WrapperComp campusName={wiz.campusName} goBackward={this.props.goBackward} closeModal={this.props.closeModal}>
    {(wiz.arg == "6_senate") &&
       [<div key="0" className="c-wizard__heading">
          UC Publication Management
        </div>,
        <div key="1" className="c-wizard__message">
          <p>Faculty use the UC Publication Management system for all eScholarship deposits– including to claim and deposit publications in compliance with the <a href="http://osc.universityofcalifornia.edu/open-access-policy">UC Academic Senate faculty Open Access Policy</a>.</p>
          <a className="c-wizard__external-link" href="https://oapolicy.universityofcalifornia.edu">Go to UC Publication Management</a>
        </div>,
        <footer key="2">
          Alternately, you may choose to wait for the system to automatically detect your new publication and send you a deposit link via email.
        </footer>]
    }
    {(/https/.test(wiz.arg)) &&
       [<div key="0" className="c-wizard__heading">
          Deposit your data in Dash 
        </div>,
        <div key="1" className="c-wizard__message">
          <p>{wiz.campusName} faculty, students and staff can take advantage of Dash, a specialized data publication and preservation service.</p>
          <a className="c-wizard__external-link" href={wiz.arg}>Go to {wiz.campusName} Dash</a>
        </div>,
        <footer key="2"></footer>]
    }
    {(wiz.arg == "6_sorry") &&
       [<div key="0" className="c-wizard__heading">
          We&#8217;re sorry... 
        </div>,
        <div key="1" className="c-wizard__message">
          <p>eScholarship currently accepts deposits from University of California affiliated faculty, researchers, staff and students only.</p>
          <p>Check the <a href="http://www.opendoar.org/">Directory of Open Access Repositories</a> to find out if an Open Access repository is available at your institution.</p>
        </div>,
        <footer key="2"></footer>]
    }
    {(wiz.arg == "6_moribund") &&
       [<div key="0" className="c-wizard__heading">
          We&#8217;re sorry... 
        </div>,
        <div key="1" className="c-wizard__message">
          <p>This {wiz.type} <b>({name})</b> is no longer active and is not accepting new deposits.</p>
          <p>Check the <a href="http://www.opendoar.org/">Directory of Open Access Repositories</a> to find out if an Open Access repository is available at your institution.</p>
        </div>,
        <footer key="2">
          If you are affiliated with this unit and interested in re-activating this series <a href={SUPPORT_LINK}>contact eScholarship support</a>.
        </footer>]
    }
    {(wiz.arg == "6_disabled") &&
       [<div key="0" className="c-wizard__heading">
          We&#8217;re sorry... 
        </div>,
        <div key="1" className="c-wizard__message">
          <p>This {wiz.type} <b>({name})</b> is not currently accepting new deposits.</p>
          <p>You may find more information on the <a href={"/uc/"+wiz.unitID}>unit’s page</a>.</p>
        </div>,
        <footer key="2"></footer>]
    }
      </WrapperComp>
      )}}
      </Contexts.Wiz.Consumer>
    )
  }
}

module.exports = WizardLinkComp;
