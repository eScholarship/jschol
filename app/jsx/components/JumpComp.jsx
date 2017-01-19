// ##### Jump Component ##### //

import React from 'react'
import { Link } from 'react-router'

class JumpComp extends React.Component {
  handleClick(e, tab_id) {  
    e.preventDefault()
    this.props.changeTab(tab_id)
  }

  render() {
    return (
      <div className="c-jump">
        <a id="c-jump__label" href="">Article</a>
        <ul className="c-jump__tree" aria-labelledby="c-jump__label">
          <li><Link to="#">Abstract</Link></li>
          <li><Link to="#">Main Content</Link></li>
          <li><Link to="#">References</Link></li>
          <li><Link to="#">Author Response</Link></li>
        </ul>
        <ul className="c-jump__siblings">
          <li><Link to="#" onClick={(e)=>this.handleClick(e, 2)}>Supplemental Material</Link></li>
          <li><Link to="#">Metrics</Link></li>
          <li><Link to="#">Author & Article Info</Link></li>
          <li><Link to="#">Comments</Link></li>
        </ul>
      </div>
    )
  }
}

module.exports = JumpComp;
