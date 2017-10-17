// ##### Teaser Component ##### //

import React from 'react'
import { Link } from 'react-router'

class TeaserComp extends React.Component {
  handleClick(e, name) {  
    e.preventDefault()
    this.props.changeAnchor(name)
  }

  render() {
    return (
      <div className="c-teaser">
        <section>
          <header>
            <h2>eScholarship Repository</h2>
          </header>
          <p>OA repository services for UC researchers to share their scholarly output.
          </p>
          <Link to="#" onClick={(e)=>this.handleClick(e, "home_repository")}>Learn More</Link>
        </section>
        <section>
          <header>
            <h2>eScholarship Publishing</h2>
          </header>
          <p>OA publishing for journals, monographs, conference proceedings and more.
          </p>
          <Link to="#" onClick={(e)=>this.handleClick(e, "home_publishing")}>Learn More</Link>
        </section>
      </div>
    )
  }
}

module.exports = TeaserComp;
