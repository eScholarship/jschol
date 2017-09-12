// ##### Campus Heading and Menu Component ##### //

import React from 'react'
import { Link } from 'react-router'

class CampusSelectorComp extends React.Component {
  state = { isOpen: false }

  closeSelector() {
    this.setState({isOpen: false})
  }

  campusSelector(campuses) {
    return campuses.map( c => {
      return c['id'] != "" && <li key={c['id']}><Link to={"/uc/"+ c['id']}
                                    onClick={()=>this.closeSelector()}>{c['name']}</Link></li>
    })
  }

  render() {
    let p = this.props
    return (
      <div className="o-customselector--campus">
        <h1 className="o-customselector__heading">
          <Link to={"/uc/" + p.campusID}>{p.campusName ? p.campusName : "eScholarship"}</Link>
        </h1>
        <details open={this.state.isOpen}
                 ref={domElement => this.details=domElement}
                 onClick={()=>setTimeout(()=>this.setState({isOpen: this.details.open}), 0)}
                 className="o-customselector__selector">
          <summary aria-label="select campus"></summary>
          <div className="o-customselector__menu">
            <div className="o-customselector__sub-heading" id="c-campusselector__sub-heading">eScholarship at &hellip;</div>
            <ul className="o-customselector__items" aria-labelledby="c-campusselector__sub-heading" role="list">
              {this.campusSelector(p.campuses)}
            </ul>
          </div>
        </details>
      </div>
    )
  }
}

module.exports = CampusSelectorComp;
