// ##### Deposit Wizard - Role Component ##### //

import React from 'react'

class WizardRoleComp extends React.Component {
  render() {
    return (
      <div className="c-wizard__step" id="c-wizard__role">
        <header>
          <h1 tabIndex="-1">eScholarship Deposit</h1>
          <button><span>Close</span></button>
        </header>
        <div className="c-wizard__heading">
          [1] How are you affiliated with [campus]?
        </div>
        <ul className="c-wizard__list">
          <li>
            <a onClick = {(event)=>{
            event.preventDefault()
            this.props.goForward(2)}
          } href="">Academic Senate-represented faculy</a>
          </li>
          <li>
            <a href="">Other faculty, student, or staff</a>
          </li>
          <li>
            <a href="">Not affiliated</a>
          </li>
        </ul>
        <footer>
          We use these questions to direct you to the right place to deposit your materials.
        </footer>
      </div>
    )
  }
}

module.exports = WizardRoleComp;
