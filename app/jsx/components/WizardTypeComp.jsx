// ##### Deposit Wizard - [3] Type Component ##### //

import React from 'react'
import { Subscriber } from 'react-broadcast'

class WizardTypeComp extends React.Component {
  render() {
    return (
      <Subscriber channel="wiz">
        { wiz => {
            // If logged in as campus, prevStep should send you back to WizardRoleComp
            let prevStep = wiz.launchedFromRoot ? 2 : 1
      return (
      <div className="c-wizard__step">
        <header>
          <h1 tabIndex="-1">{wiz.campusName} Deposit</h1>
          <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goBackward(prevStep)}
          } href=""><span>Go back</span></a>
          <button onClick={this.props.closeModal}><span>Close</span></button>
        </header>
        <div className="c-wizard__heading">
          {/* Step [3] */}
          What kind of material are you depositing?
        </div>
        <ul className="c-wizard__list">
          <li>
            <a href={"https://submit.escholarship.org/subi/directSubmit?target="+wiz.campusID}>
              A published (or accepted) scholarly article</a>
          </li>
          <li>
            <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goForward(6, {"arg": "6_dash"})}
          } href="">Data (independent or associated with a publication)</a>
          </li>
          <li>
            <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goForward(4)}
          } href="">Any other material (e.g., working paper, book, multimedia)</a>
          </li>
        </ul>
        <footer>
          We use these questions to direct you to the right place to deposit your materials.
        </footer>
      </div>
     )} }
      </Subscriber>
    )
  }
}

module.exports = WizardTypeComp;
