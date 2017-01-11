// ##### Subheader 1 Component ##### //
// # Note that for campus pages, campusID and unitID will be the same. For units, they can differ //

import React from 'react'
import { Link } from 'react-router'
import CampusSelectorComp from '../components/CampusSelectorComp.jsx'
import Nav2Comp from '../components/Nav2Comp.jsx'
import Nav3Comp from '../components/Nav3Comp.jsx'

class Subheader1Comp extends React.Component {
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
          { p.type == "campus" && <Nav2Comp campusID={p.campusID} /> }
          { p.type != "campus" && <Nav3Comp /> }
        </div>
        <div className="c-subheader__buttons">
          <a href="" className="c-subheader__button-deposit">Deposit</a>
        </div>
        <div className="c-subheader__banner">
          <Link to={"/unit/"+p.unitID}><img className="c-subheader__banner-image" src={"http://placehold.it/400x100?text="+p.unitID} alt={p.unitName} /></Link>
        </div>
      </div>
    )
  }
}

module.exports = Subheader1Comp;
