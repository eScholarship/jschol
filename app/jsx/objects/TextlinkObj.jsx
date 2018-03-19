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
          <a href="" className="o-textlink__white">White Link</a>
        </div>
        <div>
          <a href="" className="o-textlink__left-icon">Left Icon Link</a>
        </div>
        <div>
          <a href="" className="o-textlink__external-link">External Link</a>
        </div>
        <div>
          <a href="" className="o-textlink__right-arrow">Right Arrow</a>
        </div>
      </div>
    )
  }
}

module.exports = TextlinkObj;
