// ##### Subheader Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import CampusSelectorComp from '../components/CampusSelectorComp.jsx'
import NotYetLink from '../components/NotYetLink.jsx'

class SubheaderComp extends React.Component {
  static propTypes = {
    campusID: PropTypes.string.isRequired,
    campusName: PropTypes.string.isRequired,
    campuses: PropTypes.array.isRequired,
    logo: PropTypes.shape({
      url: PropTypes.string.isRequired,
      width: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired
    }).isRequired,
    unit: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      extent: PropTypes.object
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

    return (
      <div className="c-subheader">
        <CampusSelectorComp campusID={p.campusID}
                            campusName={p.campusName}
                            campuses={p.campuses} />
        <Link to={"/uc/"+p.unit.id}>
          <img className="c-subheader__banner" src={logo.url} width={logo.width} height={logo.height} alt={"Logo image for " + p.unit.name} />
        </Link>
      {p.unit.type == 'journal' ?
        <div className="c-subheader__sidebar">
          <NotYetLink className="o-button__3" element="button">Submit</NotYetLink>
          <NotYetLink className="o-button__3" element="button">Manage <span className="c-subheader__button-fragment">Submissions</span></NotYetLink>
        </div>
      :
        <div className="c-subheader__sidebar">
          <NotYetLink className="o-button__3" element="button">Deposit</NotYetLink>
        </div>
      }
      </div>
    )
  }
}

module.exports = SubheaderComp;
