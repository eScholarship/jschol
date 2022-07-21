// ##### INERT Wizard Component (not wizard-like, just a basic modal)         //
//       To direct user to Manage Submissions                                 //
//      -OR-                                                                  //
//        Used for DEPOSITING                                                 //
//        - from journals                                                     //
//        - OR for units with directSubmitURL assigned                        //
//        - OR for campuses, ORUs or series that are disabled/moribund #####  //

import React from 'react'
import PropTypes from 'prop-types'
import ReactModal from 'react-modal'

class HeaderComp extends React.Component {
  render() {
    return (
      <header>
        <h1 tabIndex="-1">{this.props.header}</h1>
        <span>&nbsp;</span>
        <button onClick={this.props.closeModal}><span>Close</span></button>
      </header>
    )
  }
}

class ManageSubmissionsComp extends React.Component {
  render() {
    let submit_url = "https://submit.escholarship.org"
    // let editor_url = this.props.directManageURL ? this.props.directManageURL : // use the directManageURL if we have one
    //                  this.props.type == 'campus' ? submit_url : 
    //                  submit_url+"/subi/directAdmin?target="+this.props.unit_id 
    //                  let editor_text = this.props.directSubmitURL_manage ||
    //                  this.props.directManageURL ? "Editor Login" : "Log in to
    //                  manage your submissions"
    let editor_url = this.props.type == 'campus' ? submit_url : submit_url+"/subi/directAdmin?target="+this.props.unit_id
    let editor_text = this.props.directSubmitURL_manage ? "Editor Login" : "Log in to manage your submissions"
    return (
      <div className="c-wizard__step">
        <HeaderComp header={this.props.header} closeModal={this.props.closeModal} />
        <div className="c-wizard__heading"></div>
        <div className="c-wizard__message">
        {/* when there is a directManageURL defined, do not show the author login, because it doesn't make sense to do so */}
        {this.props.directManageURL &&
          [<br key="0"/>, 
          <div key="1" className="c-wizard__centered"><a className="c-wizard__external-link" href={this.props.directManageURL}>{editor_text}</a></div>,
          ]
        }
        {!this.props.directManageURL &&
          [<br key="0"/>, 
          <div key="1" className="c-wizard__centered"><a className="c-wizard__external-link" href={this.props.directSubmitURL_manage}>Author Login</a></div>,
          <br key="2"/>,
          <div className="c-wizard__centered"> <a className="c-wizard__external-link" href={editor_url}>{editor_text}</a></div>,
          <br/>
          ]
        }
        </div>
        <footer></footer>
      </div>
    )
  }
}

class ElementsComp extends React.Component {
  render() {
    return (
      <div className="c-wizard__step">
        <HeaderComp header={this.props.header} closeModal={this.props.closeModal} />
        <div className="c-wizard__heading">
          UC Publication Management
        </div>
        <div className="c-wizard__message">
          <p>Faculty use the UC Publication Management system for all eScholarship deposits– including to claim and deposit publications in compliance with the <a href="http://osc.universityofcalifornia.edu/open-access-policy">UC Academic Senate faculty Open Access Policy</a>.</p>
          <a className="c-wizard__external-link" href="https://oapolicy.universityofcalifornia.edu">Go to UC Publication Management</a>
        </div>
        <footer>
          Alternately, you may choose to wait for the system to automatically detect your new publication and send you a deposit link via email.
        </footer>
      </div>
    )
  }
}

class DisabledComp extends React.Component {
  render() {
    return (
      <div className="c-wizard__step">
        <HeaderComp header={this.props.header} closeModal={this.props.closeModal} />
        <div className="c-wizard__heading">We’re sorry...</div>
          <div className="c-wizard__message">
            <p>This {this.props.type} is <b>not currently accepting</b> new submissions.</p>
          </div>
          <footer>{/* (ToDo: Add unit info to this component)
            You may find more information on the unit’s page. */}</footer>
      </div>
    )
  }
}

class MoribundComp extends React.Component {
  render() {
    return (
      <div className="c-wizard__step">
        <HeaderComp header={this.props.header} closeModal={this.props.closeModal} />
        <div className="c-wizard__heading">We’re sorry...</div>
        <div className="c-wizard__message">
          <p>This {this.props.type} is no longer active and is <b>not accepting</b> new submissions</p>
        </div>
        <footer>If you are affiliated with this {this.props.type} and interested in re-activating it, <a href="https://help.escholarship.org/support/tickets/new">contact eScholarship support</a>.</footer>
      </div>
    )
  }
}

class DirectSubmissionComp extends React.Component {
  render() {
    return (
      <div className="c-wizard__step">
        <HeaderComp header={this.props.header} closeModal={this.props.closeModal} />
        <div className="c-wizard__heading"></div>
        <div className="c-wizard__message">
          <p>Please review the {this.props.type}'s Policies and Submission Guidelines pages before continuing.</p>
          <a className="c-wizard__external-link" href={this.props.directSubmitURL}>Submit your material</a>
        </div>
        <footer></footer>
      </div>
    )
  }
}

class WizardInertComp extends React.Component {
  static propTypes = {
    showModal: PropTypes.bool.isRequired,
    onCancel: PropTypes.any,
    type: PropTypes.string,
    directSubmit: PropTypes.string,
    directSubmitURL: PropTypes.string,   // called from Deposit/Submit button
    directSubmitURL_manage: PropTypes.string,   // called from Manage Submissions button
    header: PropTypes.string,
    unit_id: PropTypes.string,
  }

  state = { showModal: this.props.showModal }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.showModal, nextProps.showModal))
      this.setState({ showModal: nextProps.showModal })
  }

  openModal = ()=> {
    this.setState({ showModal: true })
  }
  
  closeModal = ()=> {
    this.setState({ showModal: false })
    this.props.onCancel()
  }                 

  render() {
    let type = (this.props.type == 'oru') ? 'unit' : this.props.type
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
          {this.props.header == "Manage Submissions" ?
            <ManageSubmissionsComp header={this.props.header} type={type} unit_id={this.props.unit_id} closeModal={this.closeModal} directSubmitURL_manage={this.props.directSubmitURL_manage} />
            :
            this.props.directSubmit == "disabled" ?
               // Single use case here for lbnl
               type == 'campus' ?
                 <ElementsComp header={this.props.header} closeModal={this.closeModal} />
               :
                 <DisabledComp header={this.props.header} type={type} closeModal={this.closeModal} />
             :
             this.props.directSubmit == "moribund" ?
               <MoribundComp header={this.props.header} type={type} closeModal={this.closeModal} />
               :
               // this.props.directSubmit == "enabled" ?
               <DirectSubmissionComp header={this.props.header} type={type} directSubmitURL={this.props.directSubmitURL} closeModal={this.closeModal} />
          }
          </div>
        </ReactModal>
      </div>
    )
  }
}

export default WizardInertComp;
