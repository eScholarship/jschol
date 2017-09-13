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
    step: PropTypes.number.isRequired,
    showModal: PropTypes.bool.isRequired,
    campusID: PropTypes.string,
    campusName: PropTypes.string,
    campuses: PropTypes.array.isRequired
  }

  constructor(props){
    super(props)
    this.state = {wizardStep: this.props.step, wizardDir: 'fwd', showModal: this.props.showModal}
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.showModal, nextProps.showModal))
      this.setState({showModal: nextProps.showModal})
  }

  // 'campusID' as used in state is for global entry point, different from campusID passed in property (from campus page)
  // 'arg' is used for different purposes across the different wizard modals
  goForward = (step, campusID, arg) =>{
    setTimeout(()=>this.tabFocus(), 0)
    this.setState({wizardStep: step,
                   campusID: campusID,
                   arg: arg,
                   wizardDir: 'fwd',
                   prevStep: this.state.wizardStep})
  }

  goBackward = ()=>{
    setTimeout(()=>this.tabFocus(), 0)
    if (this.state.prevStep)
      this.setState({wizardStep: this.state.prevStep, wizardDir: 'bkw', prevStep: null})
    else
      this.setState({wizardStep: this.state.wizardStep - 1, wizardDir: 'bkw', prevStep: null})
  }

  tabFocus = ()=> {
    document.querySelector('.c-wizard__current-fwd h1, .c-wizard__current-bkw h1').focus()
  }

  handleOpenModal = ()=> {
    this.setState({ showModal: true })
  }
  
  handleCloseModal = ()=> {
    this.setState({ showModal: false })
    this.props.onCancel()
  }                 

  render() {
    return (
      <Broadcast className="c-modal" channel="wiz" value={
         { campusName: this.props.campusName, 
           campusID: this.state.campusID ? this.state.campusID : this.props.campusID, 
           arg: this.state.arg
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
            <div className={this.state.wizardStep === 1 ? `c-wizard__current-${this.state.wizardDir}` : `c-wizard__standby-${this.state.wizardDir}`} aria-hidden={this.state.wizardStep === 1 ? null : true}>

          {/* [1] How are you affiliated with [campus]? */}
              <WizardRoleComp goForward = {this.goForward} closeModal={this.handleCloseModal} />
            </div>
            <div className={this.state.wizardStep === 2 ? `c-wizard__current-${this.state.wizardDir}` : `c-wizard__standby-${this.state.wizardDir}`} aria-hidden={this.state.wizardStep === 2 ? null : true}>

          {/* [2] Which UC Campus are you affiliated with? */}
              <WizardCampusComp goForward = {this.goForward} goBackward = {this.goBackward} closeModal={this.handleCloseModal}
                              campuses={this.props.campuses} 
                              arg={this.state.arg} />
            </div>
            <div className={this.state.wizardStep === 3 ? `c-wizard__current-${this.state.wizardDir}` : `c-wizard__standby-${this.state.wizardDir}`} aria-hidden={this.state.wizardStep === 3 ? null : true}>

          {/* [3] What kind of material are you depositing? */}
              <WizardTypeComp goForward = {this.goForward} goBackward = {this.goBackward} closeModal={this.handleCloseModal}
                              campuses={this.props.campuses} 
                              campusID={this.state.campusID} arg={this.state.arg} />
            </div>
            <div className={this.state.wizardStep === 4 ? `c-wizard__current-${this.state.wizardDir}` : `c-wizard__standby-${this.state.wizardDir}`} aria-hidden={this.state.wizardStep === 4 ? null : true}>

          {/* [4] What is your departmental affiliation? */}
              <WizardUnitComp goForward = {this.goForward} goBackward = {this.goBackward} closeModal={this.handleCloseModal} />
            </div>
            <div className={this.state.wizardStep === 5 ? `c-wizard__current-${this.state.wizardDir}` : `c-wizard__standby-${this.state.wizardDir}`} aria-hidden={this.state.wizardStep === 5 ? null : true}>

          {/* [5] What [title] series would you like to deposit your work in?  */}
              <WizardSeriesComp goForward = {this.goForward} goBackward = {this.goBackward} closeModal={this.handleCloseModal} />
            </div>
            <div className={this.state.wizardStep === 6 ? `c-wizard__current-${this.state.wizardDir}` : `c-wizard__standby-${this.state.wizardDir}`} aria-hidden={this.state.wizardStep === 6 ? null : true}>

          {/* [6] (LinkModal: Screens vary by arg) */}
              <WizardLinkComp goBackward = {this.goBackward} closeModal={this.handleCloseModal}
                              campuses={this.props.campuses} 
                              campusID={this.state.campusID}
                              arg={this.state.arg} />
            </div>
          </div>
        </ReactModal>
      </Broadcast>
    )
  }
}

module.exports = WizardComp;
