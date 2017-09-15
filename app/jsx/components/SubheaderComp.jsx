// ##### Subheader Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'
import CampusSelectorComp from '../components/CampusSelectorComp.jsx'
import WizardComp from './WizardComp.jsx'
import { Link } from 'react-router'
import NotYetLink from '../components/NotYetLink.jsx'

class SubheaderComp extends React.Component {
  static propTypes = {
    campusID: PropTypes.string.isRequired,
    campusName: PropTypes.string.isRequired,
    ancestorID: PropTypes.string,    // Intended for series only
    campuses: PropTypes.array.isRequired,
    logo: PropTypes.shape({
      url: PropTypes.string.isRequired,
      width: PropTypes.number, // optional for SVG
      height: PropTypes.number // optional for SVG
    }),
    unit: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      extent: PropTypes.object
    }).isRequired,
  }

  state = { modalOpen: false }

  closeWizardModal = e => {
    this.setState({modalOpen:false})
  }

  render() {
    let p = this.props,
        banner_url_unit = p.unit.type.includes('series') ? p.ancestorID : p.unit.id

    var logo;
    if (p.logo) {
      logo = p.logo
    } else {
      logo = { url: "http://placehold.it/400x100?text="+p.unit.id, width: 400, height: 100 }
    }
    let depositButton = (<button id="wizardlyDeposit" className="o-button__3" onClick={(event)=>{
                                 this.setState({modalOpen:true})
                                 event.preventDefault()} }>Deposit</button>)
    let data = {campusID: p.campusID, campusName: p.campusName}
    let wizard = (<WizardComp showModal={this.state.modalOpen}
                      parentSelector={()=>$('#wizardModalBase')[0]}
                      onCancel={e=>this.closeWizardModal(e)} campuses={p.campuses}
                      data={data} />)
    return (
      <div className="c-subheader">
        <CampusSelectorComp campusID={p.campusID}
                            campusName={p.campusName}
                            campuses={p.campuses} />
        <Link to={"/uc/"+banner_url_unit} className="c-subheader__banner">
          <img src={logo.url} width={logo.width} height={logo.height} alt={"Logo for " + p.unit.name} />
        </Link>
  {/* unit.type == 'journal'  -->  Submit / Manage Submissions
      unit.type == 'campus'  -->  Deposit
      unit.type == '%series | oru'  -->  Deposit / Manage Submissions  */}
      {p.unit.type == 'journal' ?
        <div className="c-subheader__sidebar">
          <NotYetLink className="o-button__3" element="button">Submit</NotYetLink>
          <NotYetLink className="o-button__3" element="button">Manage<span className="c-subheader__button-fragment">Submissions</span></NotYetLink>
        </div>
      :
        p.unit.type == 'campus' ?
        <div id="wizardModalBase" className="c-subheader__sidebar">
          {depositButton}
          {wizard}
        </div>
      :
        <div id="wizardModalBase" className="c-subheader__sidebar">
          {depositButton}
          {wizard}
          <NotYetLink className="o-button__3" element="button">Manage<span className="c-subheader__button-fragment">Submissions</span></NotYetLink>
        </div>
      }
      </div>
    )
  }
}

module.exports = SubheaderComp;
