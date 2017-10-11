// ##### Hero Component ##### //

import React from 'react'
import { Link } from 'react-router'

class HeroComp extends React.Component {
  render() {
    return (
      <div className="c-hero--black-text" style={{backgroundImage: "url('images/hero-ucd.jpg')"}}>
        <h1>Open Access Publications from the University of California</h1>
        <div className="c-hero__campuses">
          <span>UC Davis</span>
          <Link to="/campuses">Explore all of our campuses</Link>
        </div>
      </div>
    )
  }
}

module.exports = HeroComp;
