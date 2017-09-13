// ##### Deposit Wizard - [3] Type Component ##### //

import React from 'react'
import _ from 'lodash'

class WizardTypeComp extends React.Component {
  render() {
    // this.props.arg is the campusName 
    let campusName = this.props.arg ? this.props.arg : "eScholarship"
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
        <div className="c-wizard__heading">
          What kind of material are you depositing?
        </div>
        <ul className="c-wizard__list">
          <li>
            <a href={"https://submit.escholarship.org/subi/directSubmit?target="+this.props.campusID}>
              A published (or accepted) scholarly article</a>
          </li>
          <li>
            <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goForward(6)}
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
    )
  }
}

module.exports = WizardTypeComp;
