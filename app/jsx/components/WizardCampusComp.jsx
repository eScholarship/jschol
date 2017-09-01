// ##### Deposit Wizard - Campus Component ##### //

import React from 'react'

class WizardCampusComp extends React.Component {
  render() {
    return (
      <div className="c-wizard__step" id="c-wizard__campus">
        <header>
          <h1 tabIndex="-1">eScholarship Deposit</h1>
          <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goBackward()}
          } href=""><span>Go back</span></a>
          <button><span>Close</span></button>
        </header>
        <div className="c-wizard__heading">
          [2] Which UC Campus are you affiliated with?
        </div>
        <ul className="c-wizard__list">
          <li>
            <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goForward(3)}
          } href="">UC Berkeley</a>
          </li>
          <li>
            <a href="">UC Davis</a>
          </li>
          <li>
            <a href="">UC Irvine</a>
          </li>
          <li>
            <a href="">UCLA</a>
          </li>
          <li>
            <a href="">UC Merced</a>
          </li>
          <li>
            <a href="">UC Riverside</a>
          </li>
          <li>
            <a href="">UC San Diego</a>
          </li>
          <li>
            <a href="">UC San Francisco</a>
          </li>
          <li>
            <a href="">UC Santa Barbara</a>
          </li>
          <li>
            <a href="">UC Santa Cruz</a>
          </li>
          <li>
            <a href="">UC Office of the President</a>
          </li>
          <li>
            <a href="">Lawrence Berkeley National Lab</a>
          </li>
          <li>
            <a href="">UC Agriculture and Natural Resources</a>
          </li>
        </ul>
        <footer>
          We use these questions to direct you to the right place to deposit your materials.
        </footer>
      </div>
    )
  }
}

module.exports = WizardCampusComp;
