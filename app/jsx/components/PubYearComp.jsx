// ##### Publication Year Facet Component ##### //

import React from 'react'

class PubYearComp extends React.Component {
  render() {
    return (
      <div className="c-pubyear">
        {/* placeholder attributes below should be set to the current year via scripting */}
        <div className="c-pubyear__field">
          <label htmlFor="c-pubyear__textfield1">From:</label>
          <input id="c-pubyear__textfield1" type="text" maxLength="4" placeholder="1971"/>
        </div>
        <div className="c-pubyear__field">
          <label htmlFor="c-pubyear__textfield2">To:</label>
          <input id="c-pubyear__textfield2" type="text" maxLength="4" placeholder="2014"/>
        </div>
        <button className="c-pubyear__button">Apply</button>
      </div>
    )
  }
}

module.exports = PubYearComp;
