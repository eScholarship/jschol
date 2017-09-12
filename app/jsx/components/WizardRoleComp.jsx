// ##### Deposit Wizard - [1] Role Component ##### //

import React from 'react'
import { Link } from 'react-router'

class WizardRoleComp extends React.Component {
  render() {
    let name = this.props.campusName,
        [campusName, affiliation, nextStep] = name ?
          [name, name, 3]                                     // Depositing from a campus page
        : ["eScholarship", "University of California", 2]     // Depositing from a global page
    return (
      <div className="c-wizard__step">
        <header>
          <h1 tabIndex="-1">{campusName} Deposit</h1>
          <button onClick={this.props.closeModal}><span>Close</span></button>
        </header>
        <div className="c-wizard__heading">
          [1] How are you affiliated with {affiliation}?
        </div>
        <ul className="c-wizard__list">
          <li>
            <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goForward(6, "6_senate")}
          } href="">Academic Senate-represented faculty</a>
          </li>
          <li>
            <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goForward(nextStep, nextStep+"_faculty")}
          } href="">Other faculty or staff</a>
          </li>
          <li>
            <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goForward(nextStep, nextStep+"_student")}
          } href="">Student</a>
          </li>
          <li>
            <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goForward(6, "6_sorry")}
          } href="">Not affiliated</a>
          </li>
        </ul>
      {campusName ?
        <footer>We use these questions to direct you to the right place to deposit your materials.</footer>
      :
        <footer>
          Affiliated with a different UC campus?<br/>
          <Link to="/campuses">Find your campus here.</Link>
        </footer>
      }
      </div>
    )
  }
}

module.exports = WizardRoleComp;
