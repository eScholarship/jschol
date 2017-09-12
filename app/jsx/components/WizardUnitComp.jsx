// ##### Deposit Wizard - [4] Unit Component ##### //

import React from 'react'

class WizardUnitComp extends React.Component {
  render() {
    return (
      <div className="c-wizard__step">
        <header>
          <h1 tabIndex="-1">eScholarship Deposit</h1>
          <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goBackward()}
          } href=""><span>Go back</span></a>
          <button onClick={this.props.closeModal}><span>Close</span></button>
        </header>
        <div className="c-wizard__heading">
          [4] What is your departmental affiliation?
        </div>
        <ul className="c-wizard__list">
          <li>
            <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goForward(5)}
          } href="">American Cultures Center</a>
          </li>
          <li>
            <a href="">Archaeological Research Facility</a>
          </li>
          <li>
            <a href="">Bay Area International Group</a>
          </li>
          <li>
            <a href="">Berkeley Graduate School of Journalism</a>
          </li>
          <li>
            <a href="">Berkeley Natural History Museum</a>
          </li>
          <li>
            <a href="">Berkeley Program in Law and Economics</a>
          </li>
          <li>
            <a href="">[etc.]</a>
          </li>
        </ul>
        <footer>
          Don't see your department? <a href="">Add it to eScholarship here</a>.
        </footer>
      </div>
    )
  }
}

module.exports = WizardUnitComp;
