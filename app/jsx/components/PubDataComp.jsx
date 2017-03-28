// ##### Published Data Component ##### //

import React from 'react'

class PubDataComp extends React.Component {
  render() {
    return (
      <div className="c-pubdata">
      {this.props.content_type ?
        <span>&nbsp;</span>
        : 
        <span>No data is associated with this publication.</span>
      }
      </div>
    )
  }
}

module.exports = PubDataComp;
