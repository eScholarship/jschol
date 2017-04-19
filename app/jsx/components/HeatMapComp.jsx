// ##### Heat Map Component ##### //

import React from 'react'

class HeatMapComp extends React.Component {
  render() {
    return (
      <div className="c-heatmap">
        <div className="c-heatmap__intro">
          <h1 className="c-heatmap__heading">Share your research with a <br/><strong>global audience</strong></h1>
          <button className="c-heatmap__button">Get Started</button>
          <div className="c-heatmap__legend">
            [heat map legend]
          </div>
        </div>
        <div className="c-heatmap__text">
            The eScholarship suite of open access publishing services gives UC scholars direct control over the creation and dissemination of the full range of their research.
          </div>
        <div className="c-heatmap__carousel">
          [carousel to go here]
        </div>
      </div>
    )
  }
}

module.exports = HeatMapComp;
