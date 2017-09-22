// ##### Heat Map Component ##### //

import React from 'react'
import { Link, browserHistory } from 'react-router'

class HeatMapComp extends React.Component {
  render() {
    let heroImage = "/images/herocampus_" + this.props.campusID + ".jpg"
    return (
      <div className="c-heatmap" style={{backgroundImage: "url(" + heroImage + ")"}}>
        <h1 className="c-heatmap__heading">Share your research with a <br/>global audience</h1>
        <button onClick={(e)=>{browserHistory.push("/uc/"+this.props.campusID+"/about")}} className="c-heatmap__button">Get Started</button>
        <div className="c-heatmap__text">
          The eScholarship suite of open access publishing services gives UC scholars direct control over the creation and dissemination of the full range of their research.
        </div>
      </div>
    )
  }
}

module.exports = HeatMapComp;
