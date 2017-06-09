// ##### Subheader 2 Component ##### //
// # Note that for campus pages, campusID and unitID will be the same. For units, they can differ //

import React from 'react'
import { Link } from 'react-router'
import CampusSelectorComp from '../components/CampusSelectorComp.jsx'

class Subheader2Comp extends React.Component {
  static propTypes = {
    campusID: React.PropTypes.string.isRequired,
    campusName: React.PropTypes.string.isRequired,
    campuses: React.PropTypes.array.isRequired,
    logo: React.PropTypes.shape({
      url: React.PropTypes.string.isRequired,
      width: React.PropTypes.number.isRequired,
      height: React.PropTypes.number.isRequired
    }).isRequired,
    unit: React.PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      name: React.PropTypes.string.isRequired,
      type: React.PropTypes.string.isRequired,
      extent: React.PropTypes.object
    }).isRequired,
  }

  render() {
    let p = this.props

    var logo;
    if (p.logo) {
      logo = p.logo
    } else {
      logo = { url: "http://placehold.it/400x100?text="+p.unit.id, width: 400, height: 100 }
    }

    var btns;
    if (p.type === 'journal') {
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
        <Link to={"/uc/"+p.unit.id}>
          <img className="c-subheader2__banner" src={logo.url} width={logo.width} height={logo.height} alt={"Logo image for " + p.unit.name} />
        </Link>
        <div className="c-subheader2__sidebar">
          {btns}
        </div>
      </div>
    )
    
  }
}

module.exports = Subheader2Comp;
