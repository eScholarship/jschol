// ##### Heat Map Component ##### //

import React from 'react'
import NotYetLink from '../components/NotYetLink.jsx'

class HeatMapComp extends React.Component {
  render() {
    return (
      <div className="c-heatmap" style={{backgroundImage: "url('/images/world-map.png')"}}>
        <h1 className="c-heatmap__heading">Share your research with a <br/><strong>global audience</strong></h1>
        <NotYetLink className="c-heatmap__button" element="button">Get Started</NotYetLink>
        <div className="c-heatmap__text">
          The eScholarship suite of open access publishing services gives UC scholars direct control over the creation and dissemination of the full range of their research.
        </div>
      </div>
    )
  }
}

module.exports = HeatMapComp;
