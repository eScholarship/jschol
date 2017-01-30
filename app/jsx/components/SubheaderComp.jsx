// ##### Subheader Component ##### //
// # Note that for campus pages, campusID and unitID will be the same. For units, they can differ //
// props = {
//   type:
//   unitID:
//   unitName:
//   logo: 
//   campusID:
//   campusName:
//   campuses:
// }

import React from 'react'
import { Link } from 'react-router'
import CampusSelectorComp from '../components/CampusSelectorComp.jsx'
import Nav2Comp from '../components/Nav2Comp.jsx'
import Nav3Comp from '../components/Nav3Comp.jsx'

class SubheaderComp extends React.Component {
  render() {
    let p = this.props

    var logo;
    if (p.logo) {
      logo = p.logo
    } else {
      logo = "http://placehold.it/400x100?text="+p.unitID
    }

    return (
      <div className="c-subheader">
        <CampusSelectorComp campusID={p.campusID}
                            campusName={p.campusName}
                            campuses={p.campuses} />
        <Link to={"/unit/"+p.unitID}><img className="c-subheader__banner" src={logo} alt={p.unitName} /></Link>
        <div className="c-subheader__buttons">
          <button className="o-button__3">Deposit</button>
        </div>
      </div>
    )
          // <button className="o-button__3">Submit</button>
          // <button className="o-button__3">Manage <span className="c-subheader__button-fragment">Submissions</span></button>
    
  }
}

module.exports = SubheaderComp;
