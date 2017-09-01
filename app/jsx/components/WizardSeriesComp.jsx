// ##### Deposit Wizard - Series Component ##### //

import React from 'react'

class WizardSeriesComp extends React.Component {
  render() {
    return (
      <div className="c-wizard__step" id="c-wizard__series">
        <header>
          <h1 tabIndex="-1">eScholarship Deposit</h1>
          <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goBackward()}
          } href=""><span>Go back</span></a>
          <button><span>Close</span></button>
        </header>
        <div className="c-wizard__heading">
          [5] What [title] series would you like to deposit your work in?
        </div>
        <ul className="c-wizard__list">
          <li>
            <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goForward(6)}
          } href="">Disability Law Society</a>
          </li>
          <li>
            <a href="">The Docket</a>
          </li>
          <li>
            <a href="">UCLA Law & Economics Series</a>
          </li>
          <li>
            <a href="">UCLA Public Law & Legal Theory Series</a>
          </li>
          <li>
            <a href="">Experimental Legal Scholarship Research Paper Series</a>
          </li>
        </ul>
        <footer>
          We use these questions to direct you to the right place to deposit your materials.
        </footer>
      </div>
    )
  }
}

module.exports = WizardSeriesComp;
