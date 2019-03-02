// ##### Deposit Wizard Component ##### //

import React from 'react'
import Contexts from '../contexts.jsx'
import PropTypes from 'prop-types'
import WizardCampusComp from './WizardCampusComp.jsx'
import WizardLinkComp from './WizardLinkComp.jsx'
import WizardRoleComp from './WizardRoleComp.jsx'
import WizardSeriesComp from './WizardSeriesComp.jsx'
import WizardTypeComp from './WizardTypeComp.jsx'
import WizardUnitComp from './WizardUnitComp.jsx'
import ReactModal from 'react-modal'

const SUBI_LINK = "https://submit.escholarship.org/subi/directSubmit?target="

class WizModal extends React.Component {
  render = () =>
    <ReactModal closeTimeoutMS={1000}
                isOpen={this.props.isOpen}
                parentSelector={this.props.parentSelector}
                onRequestClose={this.props.onRequestClose}
                className="c-wizard__modal"
                portalClassName="c-wiz-modal__portal"
                overlayClassName="c-modal__overlay">
      <div className="c-wizard">
        {this.props.children}
      </div>
    </ReactModal>
}

class WizardComp extends React.Component {
  static propTypes = {
    showModal: PropTypes.bool.isRequired,
    onCancel: PropTypes.any,
    campuses: PropTypes.array.isRequired,
    data: PropTypes.shape({
      campusID: PropTypes.string,
      campusName: PropTypes.string,
      unitID: PropTypes.string,
      unitName: PropTypes.string,
    })
  }

  init = () => {
    return {wizardStep: this.props.data.unitID ? 5 : 1, // If UnitID passed in on init, go direct to WizardSeriesComp
            wizardDir: 'fwd',
            campuses: this.props.campuses,
            campusID: this.props.data.campusID,
            campusName: this.props.data.campusName,
            // Unit info either passed in from an ORU landing page, or to be chosen within WizardUnitComp
            unitID: this.props.data.unitID, 
            unitName: this.props.data.unitName, 
            seriesName: null,
            arg: null,       // An arbitary field used to pass logic between steps
            type: null       // Used for distinguishing disabled/moribund units and series for last step
            }
  }

  state = { showModal: this.props.showModal,
            launchedFromRoot: !this.props.data.campusID || this.props.data.campusID == 'root',
            data: this.init()
          }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.showModal, nextProps.showModal))
      this.setState({ showModal: nextProps.showModal })
  }

  basicCampuses = (campuses) => {
    let newlist = []
    campuses.forEach((c) => {if (!["lbnl", "anrcs"].includes(c.id)) { newlist.push(c) } })
    return newlist 
  }

  getCampusName = (campusID) => {
    if (!campusID || campusID == 'root') return "eScholarship"
    let h = _.find(this.props.campuses, { 'id': campusID })
    return h ? h["name"] : this.state.data.campusName
  }

  // 'h' hash is used for different purposes across the different wizard modals
  goForward = (step, h) =>{
    setTimeout(()=>this.tabFocus(), 0)
    let campusID = (h && h['campusID']) ? h['campusID'] : this.state.data.campusID
    this.setState({data: {wizardStep: step,
                      wizardDir: 'fwd',
                      campuses: (h && /_student/.test(h['arg'])) ? this.basicCampuses(this.props.campuses) : this.props.campuses,
                      prevStep: this.state.data.wizardStep,
                      campusID: campusID,
                      campusName: this.getCampusName(campusID),
                      unitID: (h && h['unitID']) ? h['unitID'] : this.state.data.unitID,
                      unitName: (h && h['unitName']) ? h['unitName'] : this.state.data.unitName,
                      seriesName: (h && h['seriesName']) ? h['seriesName'] : this.state.data.seriesName,
                      arg: (h && h['arg']) ? h['arg'] : this.state.data.arg,
                      type: (h && h['type']) ? h['type'] : this.state.data.type}})
  }

  goBackward = (prevStep)=>{
    setTimeout(()=>this.tabFocus(), 0)
    let wizardStep
    if (prevStep) {
      wizardStep = prevStep
    }
    else if (this.state.data.prevStep)
      wizardStep = this.state.data.prevStep
    else
      wizardStep = this.state.data.wizardStep - 1
    // Strip campus info from state if user is starting over and didn't come originally from a campus
    let resetCampus = (wizardStep == 1 && this.state.launchedFromRoot)
    this.setState({data: {wizardStep: wizardStep,
                          wizardDir: 'bkw',
                          campuses: this.state.data.campuses,
                          prevStep: null,
                          campusID: resetCampus ? null : this.state.data.campusID,
                          campusName: resetCampus ? null : this.state.data.campusName,
                          unitID: this.state.data.unitID,
                          unitName: this.state.data.unitName,
                          arg: this.state.data.arg}})
  }

  tabFocus = ()=> {
    let tabHead = document.querySelector('.c-wizard__current-fwd h1, .c-wizard__current-bkw h1')
    if (tabHead)
      tabHead.focus()
  }

  handleCloseModal = ()=> {
    this.setState({ showModal: false })
    this.setState({data: this.init()})
    this.props.onCancel()
  }                 

  render() {
    let d = this.state.data
    return (
      <div className="c-modal">
      <Contexts.Wiz.Provider value={
         { launchedFromRoot: this.state.launchedFromRoot,
           campusName: d.campusName ? d.campusName : "eScholarship", 
           campusID: d.campusID,
           unitID: d.unitID,
           unitName: d.unitName,
           seriesName: d.seriesName,
           arg: d.arg,
           type: d.type
      } }>

        <WizModal isOpen={this.state.showModal && d.wizardStep === 1} onRequestClose={this.handleCloseModal} parentSelector={this.props.parentSelector}>
          <div className={d.wizardStep === 1 ? `c-wizard__current-${d.wizardDir}` : `c-wizard__standby-${d.wizardDir}`} aria-hidden={d.wizardStep === 1 ? null : true}>
            {/* [1] How are you affiliated with [campus]? */}
            <WizardRoleComp goForward = {this.goForward} closeModal={this.handleCloseModal} />
          </div>
        </WizModal>
        <WizModal isOpen={this.state.showModal && d.wizardStep === 2} onRequestClose={this.handleCloseModal} parentSelector={this.props.parentSelector}>
          <div className={d.wizardStep === 2 ? `c-wizard__current-${d.wizardDir}` : `c-wizard__standby-${d.wizardDir}`} aria-hidden={d.wizardStep === 2 ? null : true}>
            {/* [2] Which UC Campus are you affiliated with? */}
            <WizardCampusComp goForward = {this.goForward} goBackward = {this.goBackward} closeModal={this.handleCloseModal}
                            campuses={d.campuses} subi_link = {SUBI_LINK} />
          </div>
        </WizModal>
        <WizModal isOpen={this.state.showModal && d.wizardStep === 3} onRequestClose={this.handleCloseModal} parentSelector={this.props.parentSelector}>
          <div className={d.wizardStep === 3 ? `c-wizard__current-${d.wizardDir}` : `c-wizard__standby-${d.wizardDir}`} aria-hidden={d.wizardStep === 3 ? null : true}>
            {/* [3] What kind of material are you depositing? */}
            <WizardTypeComp goForward = {this.goForward} goBackward = {this.goBackward} closeModal={this.handleCloseModal}
                            subi_link = {SUBI_LINK} />
          </div>
        </WizModal>
        <WizModal isOpen={this.state.showModal && d.wizardStep === 4} onRequestClose={this.handleCloseModal} parentSelector={this.props.parentSelector}>
          <div className={d.wizardStep === 4 ? `c-wizard__current-${d.wizardDir}` : `c-wizard__standby-${d.wizardDir}`} aria-hidden={d.wizardStep === 4 ? null : true}>
            {/* [4] What is your departmental affiliation? */}
            <WizardUnitComp goForward = {this.goForward} goBackward = {this.goBackward} closeModal={this.handleCloseModal} />
          </div>
        </WizModal>
        <WizModal isOpen={this.state.showModal && d.wizardStep === 5} onRequestClose={this.handleCloseModal} parentSelector={this.props.parentSelector}>
          <div className={d.wizardStep === 5 ? `c-wizard__current-${d.wizardDir}` : `c-wizard__standby-${d.wizardDir}`} aria-hidden={d.wizardStep === 5 ? null : true}>
            {/* [5] What [title] series would you like to deposit your work in?  */}
            <WizardSeriesComp goForward = {this.goForward} goBackward = {this.goBackward} closeModal={this.handleCloseModal}
                              subi_link = {SUBI_LINK} />
          </div>
        </WizModal>
        <WizModal isOpen={this.state.showModal && d.wizardStep === 6} onRequestClose={this.handleCloseModal} parentSelector={this.props.parentSelector}>
          <div className={d.wizardStep === 6 ? `c-wizard__current-${d.wizardDir}` : `c-wizard__standby-${d.wizardDir}`} aria-hidden={d.wizardStep === 6 ? null : true}>
            {/* [6] (LinkModal: Screens vary by arg) */}
            <WizardLinkComp goBackward = {this.goBackward} closeModal={this.handleCloseModal} />
          </div>
        </WizModal>
      </Contexts.Wiz.Provider>
      </div>
    )
  }
}

module.exports = WizardComp;
