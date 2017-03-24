// ##### Published Data Component ##### //

import React from 'react'

class PubDataComp extends React.Component {
  render() {
    return (
      <div className="c-pubdata">
      {/* ToDo: Include this text only when content_type==null for no-content items. */}
        **** (UNWIRED) No data is associated with this publication. ****
      {/* If statement shouldn't appear, at least put in a nsbp, otherwise it makes for overlapping CSS blocks */}
        &nbsp;
      </div>
    )
  }
}

module.exports = PubDataComp;
