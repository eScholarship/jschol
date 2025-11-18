// ##### Journal Information Component ##### //

import React from 'react'
import RightsComp from '../components/RightsComp.jsx'
import MEDIA_PATH from '../../js/MediaPath.js'

class JournalInfoComp extends React.Component {
  render() {
    return (
      <div className="c-journalinfo">
      {this.props.doaj &&
        <img src={MEDIA_PATH + 'temp_journalinfo.png'} alt="DOAJ"/> }
      {this.props.rights &&
        <RightsComp rights={this.props.rights} size="large" /> }
      {this.props.cc_license_text &&
        <p>{this.props.cc_license_text}</p>}
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

export default JournalInfoComp;
