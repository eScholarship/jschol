// ##### Campus Heading and Menu Component ##### //

import React from 'react'
import { Link } from 'react-router'

class CampusSelectorComp extends React.Component {
  componentWillMount() {
    this.setState({isOpen: false})
    this.campusSelector = this.campusSelector.bind(this)
  }

  closeSearchRefine() {
    this.setState({isOpen: false})
  }

  campusSelector(campuses) {
    return campuses.map(function(c, i) {
      return c['id'] != "" && <Link key={i} to={"/unit/"+ c['id']}
                                    onClick={()=>this.closeSearchRefine}>{c['name']}</Link>
    })
  }

  render() {
    let p = this.props
    return (
      <div className="c-campusselector">
        <h2 className="c-campusselector__heading">
          <Link to={"/unit/" + p.campusID}>{p.campusName ? p.campusName : "eScholarship"}</Link>
        </h2>
        <details open={this.state.isOpen ? true : false} className="c-campusselector__selector">
          <summary></summary>
          <div className="c-campusselector__selector-items">
            <div>eScholarship at &hellip;</div>
            {this.campusSelector(this.props.campuses)}
          </div>
        </details>
      </div>
    )
  }
}

module.exports = CampusSelectorComp;
