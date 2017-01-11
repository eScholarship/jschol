// ##### Subheader 2 Component ##### //

import React from 'react'
import CampusSelectorComp from '../components/CampusSelectorComp.jsx'
import Nav3Comp from '../components/Nav3Comp.jsx'

class Subheader2Comp extends React.Component {
  render() {
    let p = this.props
    return (
      <div className="c-subheader">
        <div className="c-subheader__campus">
          <CampusSelectorComp campusID={p.campusID}
                              campusName={p.campusName}
                              campuses={p.campuses} />
        </div>
        <div className="c-subheader__nav">
          <Nav3Comp />
        </div>
        <div className="c-subheader__buttons">
          <a href="" className="c-subheader__button-submit">Submit</a>
          <a href="" className="c-subheader__button-manage">Manage <span className="c-subheader__button-fragment">Submissions</span></a>
        </div>
        <div className="c-subheader__banner">
          <img className="c-subheader__banner-image" src={"http://placehold.it/400x100?text="+p.unitID} alt={p.unitName} />
        </div>
      </div>
    )
  }
}

module.exports = Subheader2Comp;
