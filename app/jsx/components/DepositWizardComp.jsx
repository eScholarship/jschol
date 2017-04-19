// ##### Deposit Wizard Component ##### //

import React from 'react'
import ReactModal from 'react-modal'

class DepositWizardComp extends React.Component {
  constructor () {
    super();
    this.state = {
      showModal: true
    };
    
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
  }
  
  handleOpenModal () {
    this.setState({ showModal: true });
  }
  
  handleCloseModal () {
    this.setState({ showModal: false });
  }
  render() {
    return (
      <div className="c-depositwizard">
        {/* onClick element below can be a button or link */}
        <button onClick={this.handleOpenModal}>Trigger Deposit Wizard</button>
        <ReactModal 
           isOpen={this.state.showModal}
           contentLabel="onRequestClose Example"
           onRequestClose={this.handleCloseModal}
           className="c-depositwizard--open"
           overlayClassName="c-depositwizard__overlay"
        >
          <div className="c-depositwizard__header">
            <h2>Deposit Wizard (in progress)</h2>
            <button className="c-depositwizard__close" onClick={this.handleCloseModal} aria-label="close"></button>
          </div>
          <div className="c-depositwizard__content">
            What kind of material are you depositing?
            <a href="">A published (or accepted) scholarly article</a>
            <a href="">Any other material (e.g., working paper, book, multimedia)</a>
          </div>
          <div className="c-depositwizard__footer">
            We use these questions to direct you to the right place to deposit your materials.
          </div>
        </ReactModal>
      </div>
    )
  }
}

module.exports = DepositWizardComp;
