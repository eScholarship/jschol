// ##### Journal Information Component ##### //

import React from 'react'

class JournalInfoComp extends React.Component {
  render() {
    return (
      <div className="c-journalinfo">
        <img src="images/temp_journalinfo.png" alt="DOAJ"/>
        <img src="images/icon_cc-by.svg" alt="copyright"/>
        <ul>
          <li><b>e-ISSN-</b> 0160-2764</li>
          <li><b>e-ISSN-</b> 0160-2765</li>
        </ul>
      </div>
    )
  }
}

module.exports = JournalInfoComp;
