// ##### Text Link Objects ##### //

import React from 'react'

class TextlinkObj extends React.Component {
  render() {
    return (
      <div>
        <div>
          <a href="" className="o-textlink__primary">Primary Link</a>
        </div>
        <div>
          <a href="" className="o-textlink__secondary">Secondary Link</a>
        </div>
        <div>
          <a href="" className="o-textlink__black">Black Link</a>
        </div>
        <div>
          <a href="" className="o-textlink__left-icon">Left Icon Link</a>
        </div>
        <div>
          <a href="" className="o-textlink__external-link-button">Deposit</a>
        </div>
      </div>
    )
  }
}

module.exports = TextlinkObj;
