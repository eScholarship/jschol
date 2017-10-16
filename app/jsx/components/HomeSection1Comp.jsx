// ##### Home Section 1 Component ##### //

import React from 'react'
import { Link } from 'react-router'

class HomeSection1Comp extends React.Component {
  render() {
    return (
      <div className="c-homesection1">
        <h2 className="c-homesection1__heading">Why Open Access?</h2>
        <div className="c-homesection1__description">
          <h3>Good for Authors</h3>
          <p>Open access research is read and cited more than access-restricted scholarship, increasing the academic impact of and public engagement with your ideas.</p>
          <h3>Good for Readers</h3>
          <p>The University of California’s Open Access policies extend the University’s public mission to share broadly -- throughout California, the nation, and the world -- the research and knowledge produced at our campuses.</p>
        </div>
        <h3 className="c-homesection1__stat-heading">Metrics of Use</h3>
        <div className="o-stat">
          <div className="o-stat--item">
            <a href="">99,999</a> Items
          </div>
          <div className="o-stat--units">
            <a href="">999</a> Research Units
            {/* data.statsCountOrus.toLocaleString() */}
          </div>
      {/* <div className="o-stat--passed">
            <a href="">9,999</a> Items since UC <br/> OA Policy passed
          </div> */}
        </div>
        <Link to="/uc/root/ucoapolicies" className="c-homesection1__more">Learn more about UC Open Access</Link>
      </div>
    )
  }
}

module.exports = HomeSection1Comp;
