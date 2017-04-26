// ##### Jump Component ##### //
{/* This component only renders for published items with a content_type */}

import React from 'react'
import { Link } from 'react-router'

class JumpComp extends React.Component {
  handleClick(e, tabName) {  
    e.preventDefault()
    this.props.changeTab(tabName)
  }

  render() {
    return (
      <div className="c-jump">
        <Link id="c-jump__label" to="#" onClick={(e)=>this.handleClick(e, "main")}>Article</Link>
        <ul className="c-jump__tree" aria-labelledby="c-jump__label">
       { this.props.attrs.abstract &&
          <li><Link to="#" onClick={(e)=>this.handleClick(e, "article_abstract")}>Abstract</Link></li>
       }
          <li><Link to="#">Main Content</Link></li>
          <li><Link to="#">References</Link></li>
        </ul>
        <ul className="c-jump__siblings">
       { this.props.attrs.supp_files &&
          <li><Link to="#" onClick={(e)=>this.handleClick(e, "supplemental")}>Supplemental Material</Link></li>
       }
          <li><Link to="#" onClick={(e)=>this.handleClick(e, "metrics")}>Metrics</Link></li>
          <li><Link to="#" onClick={(e)=>this.handleClick(e, "author")}>Author & Article Info</Link></li>
        </ul>
      </div>
    )
  }
}

module.exports = JumpComp;
