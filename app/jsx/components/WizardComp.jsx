// ##### Deposit Wizard Component ##### //

import React from 'react'
import { Broadcast, Subscriber } from 'react-broadcast'
import PropTypes from 'prop-types'
import WizardCampusComp from './WizardCampusComp.jsx'
import WizardLinkComp from './WizardLinkComp.jsx'
import WizardRoleComp from './WizardRoleComp.jsx'
import WizardSeriesComp from './WizardSeriesComp.jsx'
import WizardTypeComp from './WizardTypeComp.jsx'
import WizardUnitComp from './WizardUnitComp.jsx'
import ReactModal from 'react-modal'

class WizardComp extends React.Component {
  static propTypes = {
    showModal: PropTypes.bool.isRequired,
    onCancel: PropTypes.any,
    campuses: PropTypes.array.isRequired,
    data: PropTypes.shape({
      wizardStep: PropTypes.number.isRequired,
      wizardDir: PropTypes.string.isRequired,
      campusID: PropTypes.string,
      campusName: PropTypes.string,
      arg: PropTypes.string
    })

  }

  state = { showModal: this.props.showModal,
            data: this.props.data }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.showModal, nextProps.showModal))
      this.setState({showModal: nextProps.showModal})
  }

  getCampusName = (campusID) => {
    if (campusID == 'root') {return "eScholarship"}
    let h = _.find(this.props.campuses, { 'id': campusID })
    return h ? h["name"] : this.state.data.campusName
  }

  // 'campusID' as used in state is for global entry point, different from campusID passed in property (from campus page)
  // 'arg' is used for different purposes across the different wizard modals
  goForward = (step, campusID, arg) =>{
    setTimeout(()=>this.tabFocus(), 0)
    let campusName = this.getCampusName(campusID)
    this.setState({data: {wizardStep: step,
                          wizardDir: 'fwd',
                          prevStep: this.state.data.wizardStep,
                          campusID: campusID,
                          campusName: campusName,
                          arg: arg ? arg : this.state.data.arg}})
  }

  goBackward = ()=>{
    setTimeout(()=>this.tabFocus(), 0)
    let wizardStep
    if (this.state.data.prevStep)
      wizardStep = this.state.data.prevStep
    else
      wizardStep = this.state.data.wizardStep - 1
    this.setState({data: {wizardStep: wizardStep,
                          wizardDir: 'bkw',
                          prevStep: null,
                          campusID: this.state.data.campusID,
                          campusName: this.state.data.campusName,
                          arg: this.state.data.arg}})
  }

  tabFocus = ()=> {
    document.querySelector('.c-wizard__current-fwd h1, .c-wizard__current-bkw h1').focus()
  }

  handleOpenModal = ()=> {
    this.setState({ showModal: true })
  }
  
  handleCloseModal = ()=> {
    this.setState({ showModal: false })
    this.setState({data: { wizardStep: 1, wizardDir: 'fwd' }})
    this.props.onCancel()
  }                 

  render() {
    let d = this.state.data
    return (
      <div className="c-modal">
      <Broadcast className="c-modal" channel="wiz" value={
         { campusName: d.campusName ? d.campusName : "eScholarship", 
           campusID: d.campusID, 
           arg: d.arg
      } }>

        <ReactModal 
          parentSelector={this.props.parentSelector}
          isOpen={this.state.showModal}
          contentLabel="onRequestClose Example"
          onRequestClose={this.handleCloseModal}
          className="c-wizard__modal"
          overlayClassName="c-modal__overlay"
        >
          <div className="c-wizard">
            <div className={d.wizardStep === 1 ? `c-wizard__current-${d.wizardDir}` : `c-wizard__standby-${d.wizardDir}`} aria-hidden={d.wizardStep === 1 ? null : true}>

          {/* [1] How are you affiliated with [campus]? */}
              <WizardRoleComp goForward = {this.goForward} closeModal={this.handleCloseModal} />
            </div>
            <div className={d.wizardStep === 2 ? `c-wizard__current-${d.wizardDir}` : `c-wizard__standby-${d.wizardDir}`} aria-hidden={d.wizardStep === 2 ? null : true}>

          {/* [2] Which UC Campus are you affiliated with? */}
              <WizardCampusComp goForward = {this.goForward} goBackward = {this.goBackward} closeModal={this.handleCloseModal}
                              campuses={this.props.campuses}
                              arg={d.arg} />
            </div>
            <div className={d.wizardStep === 3 ? `c-wizard__current-${d.wizardDir}` : `c-wizard__standby-${d.wizardDir}`} aria-hidden={d.wizardStep === 3 ? null : true}>

          {/* [3] What kind of material are you depositing? */}
              <WizardTypeComp goForward = {this.goForward} goBackward = {this.goBackward} closeModal={this.handleCloseModal}
                              campuses={this.props.campuses}
                              campusID={d.campusID} arg={d.arg} />
            </div>
            <div className={d.wizardStep === 4 ? `c-wizard__current-${d.wizardDir}` : `c-wizard__standby-${d.wizardDir}`} aria-hidden={d.wizardStep === 4 ? null : true}>

          {/* [4] What is your departmental affiliation? */}
              <WizardUnitComp goForward = {this.goForward} goBackward = {this.goBackward} closeModal={this.handleCloseModal} />
            </div>
            <div className={d.wizardStep === 5 ? `c-wizard__current-${d.wizardDir}` : `c-wizard__standby-${d.wizardDir}`} aria-hidden={d.wizardStep === 5 ? null : true}>

          {/* [5] What [title] series would you like to deposit your work in?  */}
              <WizardSeriesComp goForward = {this.goForward} goBackward = {this.goBackward} closeModal={this.handleCloseModal} />
            </div>
            <div className={d.wizardStep === 6 ? `c-wizard__current-${d.wizardDir}` : `c-wizard__standby-${d.wizardDir}`} aria-hidden={d.wizardStep === 6 ? null : true}>

          {/* [6] (LinkModal: Screens vary by arg) */}
              <WizardLinkComp goBackward = {this.goBackward} closeModal={this.handleCloseModal}
                              campuses={this.props.campuses}
                              campusID={d.campusID}
                              arg={d.arg} />
            </div>
          </div>
        </ReactModal>
      </Broadcast>
      </div>
    )
  }
}

module.exports = WizardComp;
