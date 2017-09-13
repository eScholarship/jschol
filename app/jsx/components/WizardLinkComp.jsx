// ##### Deposit Wizard - [6] Link Component ##### //

import React from 'react'

class WizardLinkComp extends React.Component {
  render() {
    let h = this.props.campusID ? _.find(this.props.campuses, { 'id': this.props.campusID }) : {}
    let campusName = h ? h["name"] : "eScholarship"
    return (
      <div className="c-wizard__step">
        <header>
          <h1 tabIndex="-1">{campusName} Deposit</h1>
          <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goBackward()}
          } href=""><span>Go back</span></a>
          <button onClick={this.props.closeModal}><span>Close</span></button>
        </header>
      {this.props.arg == "6_senate" &&
       [<div key="0" className="c-wizard__heading">
          [6] UC Publication Management
        </div>,
        <div key="1" className="c-wizard__message">
          <p>Faculty use the UC Publication Management system for all eScholarship deposits– including to claim and deposit publications in compliance with the <a href="http://osc.universityofcalifornia.edu/open-access-policy">UC Academic Senate faculty Open Access Policy</a>.</p>
          <a href="https://oapolicy.universityofcalifornia.edu">Go to UC Publication Management</a>
        </div>,
        <footer key="2">
          Alternately, you may choose to wait for the system to automatically detect your new publication and send you a deposit link via email.
        </footer>]
      }
      {this.props.arg == "6_dash" &&
       [<div key="0" className="c-wizard__heading">
          [6] Deposit your data in Dash 
        </div>,
        <div key="1" className="c-wizard__message">
          <p>****CAMPUSName *** faculty, students and staff can take advantage of Dash, a specialized data publication and preservation service.</p>
          <a href="">Go to ***** campusName **** Dash</a>
        </div>,
        <footer key="2"></footer>]
      }
      {this.props.arg == "6_sorry" &&
       [<div key="0" className="c-wizard__heading">
          We&#8217;re sorry... 
        </div>,
        <div key="1" className="c-wizard__message">
          <p>eScholarship currently accepts deposits from University of California affiliated faculty, researchers, staff and students only.</p>
          <p>Check the <a href="http://www.opendoar.org/">Directory of Open Access Repositories</a> to find out if an Open Access repository is available at your institution.</p>
        </div>,
        <footer key="2"></footer>]
      }
      </div>
    )
  }
}

module.exports = WizardLinkComp;
