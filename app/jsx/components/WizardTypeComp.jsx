// ##### Deposit Wizard - [3] Type Component ##### //

import React from 'react'
import Contexts from '../contexts.jsx'

const DASH_LIST = {
    'ucb': 'https://datadryad.org',
    'uci': 'https://datadryad.org',
    'ucm': 'https://datadryad.org',
    'ucop': 'https://datadryad.org',
    'ucr': 'https://datadryad.org',
    'ucsc': 'https://datadryad.org',
    'ucsf': 'https://datadryad.org',
  }

class WizardTypeComp extends React.Component {
  render() {
    return (
      <Contexts.Wiz.Consumer>
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
            <a href={this.props.subi_link+wiz.campusID+"_postprints"}>
              A published (or accepted) scholarly article, book or chapter</a>
          </li>
        {Object.keys(DASH_LIST).includes(wiz.campusID) &&
          <li>
            <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goForward(6, {"arg": DASH_LIST[wiz.campusID]})}
          } href="">Data (independent or associated with a publication)</a>
          </li>
        }
          <li>
            <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goForward(4)}
          } href="">Any other material (e.g., working paper, multimedia)</a>
          </li>
        </ul>
        <footer>
          We use these questions to direct you to the right place to deposit your materials.
        </footer>
      </div>
     )} }
      </Contexts.Wiz.Consumer>
    )
  }
}

export default WizardTypeComp;
