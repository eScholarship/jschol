// ##### Journal Information Component ##### //

import React from 'react'
import RightsComp from '../components/RightsComp.jsx'

class JournalInfoComp extends React.Component {
  render() {
    return (
      <div className="c-journalinfo">
        <img src="/images/temp_journalinfo.png" alt="DOAJ"/>
      {this.props.rights &&
        <RightsComp rights={this.props.rights} size="large" /> }
        <ul>
          <li><b>e-ISSN-</b> 9999-9999</li>
          <li><b>e-ISSN-</b> 9999-9999</li>
        </ul>
      </div>
    )
  }
}

module.exports = JournalInfoComp;
