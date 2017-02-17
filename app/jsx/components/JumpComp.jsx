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
        <Link id="c-jump__label" to="#" onClick={(e)=>this.handleClick(e, 1)}>Article</Link>
        <ul className="c-jump__tree" aria-labelledby="c-jump__label">
          <li><Link to="#">Abstract</Link></li>
          <li><Link to="#">Main Content</Link></li>
          <li><Link to="#">References</Link></li>
          <li><Link to="#">Author Response</Link></li>
        </ul>
        <ul className="c-jump__siblings">
          <li><Link to="#" onClick={(e)=>this.handleClick(e, 2)}>Supplemental Material</Link></li>
          <li><Link to="#" onClick={(e)=>this.handleClick(e, 3)}>Metrics</Link></li>
          <li><Link to="#" onClick={(e)=>this.handleClick(e, 4)}>Author & Article Info</Link></li>
          <li><Link to="#" onClick={(e)=>this.handleClick(e, 5)}>Comments</Link></li>
        </ul>
      </div>
    )
  }
}

module.exports = JumpComp;
