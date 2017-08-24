// ##### Journal Information Component ##### //

import React from 'react'
import RightsComp from '../components/RightsComp.jsx'

class JournalInfoComp extends React.Component {
  render() {
    return (
      <div className="c-journalinfo">
      {this.props.doaj &&
        <img src="/images/temp_journalinfo.png" alt="DOAJ"/> }
      {this.props.rights &&
        <RightsComp rights={this.props.rights} size="large" /> }
        <ul>
      {this.props.issn &&
          <li><b>ISSN:</b> {this.props.issn}</li> }
      {this.props.eissn &&
          <li><b>e-ISSN:</b> {this.props.eissn}</li> }
        </ul>
      </div>
    )
  }
}

module.exports = JournalInfoComp;
