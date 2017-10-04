// ##### Subheader Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'
import CampusSelectorComp from '../components/CampusSelectorComp.jsx'
import WizardComp from './WizardComp.jsx'
import WizardInertComp from './WizardInertComp.jsx'
import { Link } from 'react-router'
import NotYetLink from '../components/NotYetLink.jsx'

class SubheaderComp extends React.Component {
  static propTypes = {
    header: PropTypes.shape({
      campusID: PropTypes.string.isRequired,
      campusName: PropTypes.string.isRequired,
      ancestorID: PropTypes.string,    // Intended for series only
      ancestorName: PropTypes.string,    // Intended for series only
      campuses: PropTypes.array.isRequired,
      directSubmit: PropTypes.string,
      logo: PropTypes.shape({
        url: PropTypes.string.isRequired,
        width: PropTypes.number, // optional for SVG
        height: PropTypes.number // optional for SVG
      }),
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
    let unit = this.props.unit
    let h = this.props.header
    let banner_class = (h.logo && h.logo.is_banner) ? "c-subheader__banner--wide" : "c-subheader__banner--narrow"
    let [banner_url, banner_title] = unit.type.includes('series') ? [h.ancestorID, h.ancestorName] : [unit.id, unit.name]
    let directSubmitURL = h.directSubmitURL ? h.directSubmitURL : "https://submit.escholarship.org/subi/directSubmit?target="+unit.id

   // Button Configuration based on unit type
   //   unit.type == 'journal'  -->  Submit / Manage Submissions
   //   unit.type == 'campus'  -->  Deposit
   //   unit.type == '%series | oru'  -->  Deposit / Manage Submissions  */}

    let wizard = null
    let depositButton = <button id="wizardlyDeposit" className="o-button__3" onClick={(event)=>{
                               this.setState({modalOpen:true})
                               event.preventDefault()} } >{(unit.type == 'journal') ? "Submit" : "Deposit"}</button>

    // WizardInertComp is like WizardComp, but only one screen, no back/forward buttons,
    //   a) used for all journals  -OR-
    //   b) used for a campus/unit/series when its 'directSubmit' value is set to disabled/moribund. 
    // Right now, this component also handles a directSubmitURL if one is present
    // (Presently the directSubmitURL only exists for journals).

    // Note: Disabled and Moribund Units/Series are also uniquely handled when coming in
    //   at a higher level from within WizardUnitComp and WizardSeriesComp (handled by WizardComp below)
    if (unit.type == 'journal' || ["moribund", "disabled", "hide"].includes(h.directSubmit)) {
      wizard = (<WizardInertComp showModal={this.state.modalOpen}
                      parentSelector={()=>$('#wizardModalBase')[0]}
                      onCancel={e=>this.closeWizardModal(e)}
                      header={(unit.type == 'journal') ? unit.name : h.campusName+" Deposit"}
                      type={unit.type} directSubmit={h.directSubmit} directSubmitURL={directSubmitURL} />)
    } else {
      // If unit is a series, pass in its parent's unitID
      let [unitIDForWiz, unitNameForWiz] = (unit.type == 'oru') ? [unit.id, unit.name] : (unit.type.includes('series')) ? [h.ancestorID, h.ancestorName] : [null, null]
      wizard = (<WizardComp showModal={this.state.modalOpen}
                  parentSelector={()=>$('#wizardModalBase')[0]}
                  onCancel={e=>this.closeWizardModal(e)}
                  campuses={h.campuses}
                  data={{campusID: h.campusID, campusName: h.campusName, unitID: unitIDForWiz, unitName: unitNameForWiz}}
                />)
    }
    return (
      <div className="c-subheader">
        <CampusSelectorComp campusID={h.campusID}
                            campusName={h.campusName}
                            campuses={h.campuses} />
        <Link to={"/uc/"+banner_url} className={banner_class}>
          <h1>{banner_title}</h1>
        {h.logo &&
          <img src={h.logo.url} width={h.logo.width} height={h.logo.height} alt={unit.name} />
        }
        </Link>
      {unit.type == 'journal' ?
        <div id="wizardModalBase" className="c-subheader__sidebar">
          {depositButton}
          {wizard}
          <NotYetLink className="o-button__3" element="button">Manage<span className="c-subheader__button-fragment">Submissions</span></NotYetLink>
        </div>
      :
        unit.type == 'campus' ?
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
