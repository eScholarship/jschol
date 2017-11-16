// ##### Button Objects ##### //

import React from 'react'

class InputObj extends React.Component {
  render() {
    return (
      <div>
      
        <button className="o-button__1">Clear All</button>

        <button className="o-button__2">Cancel</button>

        <button className="o-button__3">Select</button>

        <button className="o-button__4">Manage Submissions</button>

        <button className="o-button__5">Export</button>

        <button className="o-button__6">Buy in Print</button>

        <button className="o-button__7">Download</button>

        <button className="o-button__8">Get Started</button>

        <button className="o-button__9" aria-label="search"></button>

        <button className="o-button__10">Previous</button>

        <h2>Same Buttons Above but with Disabled State</h2>

        <button disabled className="o-button__10">Previous</button>

      </div>
    )
  }
}

module.exports = InputObj;
