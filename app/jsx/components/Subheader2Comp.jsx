// ##### Subheader 2 Component ##### //
// # Note that for campus pages, campusID and unitID will be the same. For units, they can differ //
// props = {
//   unit:
//   logo: 
//   campusID:
//   campusName:
//   campuses:
// }

import React from 'react'
import { Link } from 'react-router'
import CampusSelectorComp from '../components/CampusSelectorComp.jsx'

class Subheader2Comp extends React.Component {
  render() {
    let p = this.props

    var logo;
    if (p.logo) {
      logo = p.logo
    } else {
      logo = "http://placehold.it/400x100?text="+p.unit.id
    }

    var btns;
    if (p.unit.type === 'journal') {
      btns = [
        <button className="o-button__3" key="submit">Submit</button>,
        <button className="o-button__3" key="manage">Manage 
        <span className="c-subheader2__button-fragment">Submissions</span></button>
      ]
    } else {
      btns = [<button className="o-button__3" key="deposit">Deposit</button>]
    }

    return (
      <div className="c-subheader2">
        <CampusSelectorComp campusID={p.campusID}
                            campusName={p.campusName}
                            campuses={p.campuses} />
        <Link to={"/unit/"+p.unit.id}><img className="c-subheader2__banner" src={logo} alt={p.unit.name} /></Link>
        <div className="c-subheader2__buttons">
          {btns}
        </div>
      </div>
    )
    
  }
}

module.exports = Subheader2Comp;
