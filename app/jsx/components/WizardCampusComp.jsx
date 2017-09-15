// ##### Deposit Wizard - [2] Campus Component ##### //

import React from 'react'
import { Subscriber } from 'react-broadcast'
import PropTypes from 'prop-types'

class WizardCampusComp extends React.Component {
  static propTypes = {
    campusID: PropTypes.string,   // Not used here
    arg: PropTypes.string,
    goBackward: PropTypes.any.isRequired,
    goForward: PropTypes.any.isRequired,
    campuses: PropTypes.array.isRequired
  }

  campusList(campuses, next) {
    return campuses.map( c => {
      return c.id != "" && 
      <li key={c.id}>
        <a onClick = {(event)=>{
        event.preventDefault()
        this.props.goForward(next, c.id)}
      } href="">{c.name}</a>
      </li>
    })
  }

  render() {
    // Student is not asked to select type of material (skip step 3)
    let nextStep = (this.props.arg == "2_student") ? 4 : 3
    return (
      <Subscriber channel="wiz">
        { wiz => {
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
          Which UC Campus are you affiliated with?
        </div>
        <ul className="c-wizard__list">
          {this.campusList(this.props.campuses, nextStep)}
        </ul>
        <footer>
          We use these questions to direct you to the right place to deposit your materials.
        </footer>
      </div>
      )}}
      </Subscriber>
    )
  }
}

module.exports = WizardCampusComp;
