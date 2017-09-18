// ##### INERT Deposit Wizard Component Used for journals or series that are disabled/moribund ##### //

import React from 'react'
import PropTypes from 'prop-types'
import ReactModal from 'react-modal'

class WizardInertComp extends React.Component {
  static propTypes = {
    showModal: PropTypes.bool.isRequired,
    onCancel: PropTypes.any,
    type: PropTypes.string.isRequired,
    directSubmit: PropTypes.string.isRequired,
    campusName: PropTypes.string,
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
            <div className="c-wizard__step">
              <header>
                <h1 tabIndex="-1">{this.props.campusName} Deposit</h1>
                <span>&nbsp;</span>
                <button onClick={this.closeModal}><span>Close</span></button>
              </header>
              <div className="c-wizard__heading">
                We’re sorry...
              </div>
            {this.props.directSubmit == "disabled" ?
             [<div key="0" className="c-wizard__message">
                <p>This {this.props.type} is <b>not currently accepting</b> new submissions.</p>
              </div>,
              <footer key="1"></footer>]
            :
             [<div key="0" className="c-wizard__message">
                <p>This {this.props.type} is no longer active and is <b>not accepting</b> new submissions</p>
              </div>,
              <footer key="1">If you are affiliated with this {this.props.type} and interested in re-activating it, <a href="https://help.escholarship.org/support/tickets/new">contact eScholarship support</a>.
</footer>]
            }
            </div>
          </div>
        </ReactModal>
      </div>
    )
  }
}

module.exports = WizardInertComp;
