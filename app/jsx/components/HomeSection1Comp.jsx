// ##### Home Section 1 Component ##### //

import React from 'react'
import { Link } from 'react-router'

class HomeSection1Comp extends React.Component {
  render() {
    return (
      <div className="c-homesection__1">
        <div className="c-homesection__1-description">
          <h3>Good for Authors</h3>
          <p>Open Access research is read and cited more than access-restricted scholarship, increasing the academic impact of and public engagement with your ideas.</p>
          <h3>Good for Readers</h3>
          <p>The University of California’s Open Access policies extend the University’s public mission to share broadly &mdash; throughout California, the nation, and the world &mdash; the research and knowledge produced at our campuses.</p>
        </div>
        <h3 className="c-homesection__1-metrics-heading">Metrics of Use</h3>
        <div className="o-stat">
          <div className="o-stat--item">
            <b>{this.props.stats.statsCountItems.toLocaleString()}</b> Items
          </div>
          <div className="o-stat--view">
            <b>{this.props.stats.statsCountViews.toLocaleString()}</b> Views
          </div>
      {/* <div className="o-stat--passed">
            <a href="">9,999</a> Items since UC <br/> OA Policy passed
          </div> */}
        </div>
        <Link to="/ucoapolicies" className="c-homesection__1-link">Learn more about UC Open Access</Link>
      </div>
    )
  }
}

module.exports = HomeSection1Comp;
