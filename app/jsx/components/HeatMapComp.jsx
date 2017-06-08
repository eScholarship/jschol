// ##### Heat Map Component ##### //

import React from 'react'

class HeatMapComp extends React.Component {
  render() {
    return (
      <div className="c-heatmap" style={{backgroundImage: "url('/images/sample_heatmap.png')"}}>
        <h1 className="c-heatmap__heading">Share your research with a <br/><strong>global audience</strong></h1>
        <button className="c-heatmap__button">Get Started</button>
        <div className="c-heatmap__text">
          The eScholarship suite of open access publishing services gives UC scholars direct control over the creation and dissemination of the full range of their research.
        </div>
      </div>
    )
  }
}

module.exports = HeatMapComp;
