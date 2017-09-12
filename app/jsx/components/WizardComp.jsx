// ##### Deposit Wizard Component ##### //

import React from 'react'
import WizardCampusComp from './WizardCampusComp.jsx'
import WizardLinkComp from './WizardLinkComp.jsx'
import WizardRoleComp from './WizardRoleComp.jsx'
import WizardSeriesComp from './WizardSeriesComp.jsx'
import WizardTypeComp from './WizardTypeComp.jsx'
import WizardUnitComp from './WizardUnitComp.jsx'
import ReactModal from 'react-modal'

class WizardComp extends React.Component {

  constructor(props){
    super(props)
    this.state = {wizardStep: this.props.step, wizardDir: 'fwd', showModal: this.props.showModal}
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.showModal, nextProps.showModal))
      this.setState({showModal: nextProps.showModal})
  }

  goForward = (step, mode) =>{
    setTimeout(()=>this.tabFocus(), 0)
    this.setState({mode: mode, wizardStep: step, wizardDir: 'fwd', prevStep: this.state.wizardStep})
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
      <div className="c-modal">
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
              <WizardRoleComp goForward = {this.goForward} closeModal={this.handleCloseModal}
                              campusName={this.props.campusName} />
            </div>
            <div className={this.state.wizardStep === 2 ? `c-wizard__current-${this.state.wizardDir}` : `c-wizard__standby-${this.state.wizardDir}`} aria-hidden={this.state.wizardStep === 2 ? null : true}>

            {/* [2] Which UC Campus are you affiliated with? */}
              <WizardCampusComp goForward = {this.goForward} goBackward = {this.goBackward} closeModal={this.handleCloseModal}
                              campusName={this.props.campusName} />
            </div>
            <div className={this.state.wizardStep === 3 ? `c-wizard__current-${this.state.wizardDir}` : `c-wizard__standby-${this.state.wizardDir}`} aria-hidden={this.state.wizardStep === 3 ? null : true}>
              <WizardTypeComp goForward = {this.goForward} goBackward = {this.goBackward} closeModal={this.handleCloseModal} />
            </div>
            <div className={this.state.wizardStep === 4 ? `c-wizard__current-${this.state.wizardDir}` : `c-wizard__standby-${this.state.wizardDir}`} aria-hidden={this.state.wizardStep === 4 ? null : true}>
              <WizardUnitComp goForward = {this.goForward} goBackward = {this.goBackward} closeModal={this.handleCloseModal} />
            </div>
            <div className={this.state.wizardStep === 5 ? `c-wizard__current-${this.state.wizardDir}` : `c-wizard__standby-${this.state.wizardDir}`} aria-hidden={this.state.wizardStep === 5 ? null : true}>
              <WizardSeriesComp goForward = {this.goForward} goBackward = {this.goBackward} closeModal={this.handleCloseModal} />
            </div>
            <div className={this.state.wizardStep === 6 ? `c-wizard__current-${this.state.wizardDir}` : `c-wizard__standby-${this.state.wizardDir}`} aria-hidden={this.state.wizardStep === 6 ? null : true}>

            {/* [6] (LinkModal: Screens vary by mode) */}
              <WizardLinkComp goBackward = {this.goBackward} closeModal={this.handleCloseModal}
                              mode = {this.state.mode} />
            </div>
          </div>
        </ReactModal>
      </div>
    )
  }
}

module.exports = WizardComp;
