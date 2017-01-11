// ##### Jump Component ##### //

import React from 'react'

class JumpComp extends React.Component {
  render() {
    return (
      <div className="c-jump">
        <a id="c-jump__label" href="">Article</a>
        <ul className="c-jump__tree" aria-labelledby="c-jump__label">
          <li><a href="">Abstract</a></li>
          <li><a href="">Main Content</a></li>
          <li><a href="">References</a></li>
          <li><a href="">Author Response</a></li>
        </ul>
        <ul className="c-jump__siblings">
          <li><a href="">Supplemental Material</a></li>
          <li><a href="">Metrics</a></li>
          <li><a href="">Author & Article Info</a></li>
          <li><a href="">Comments</a></li>
        </ul>
      </div>
    )
  }
}

module.exports = JumpComp;
