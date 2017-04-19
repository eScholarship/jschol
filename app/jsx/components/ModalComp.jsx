// ##### Modal Component ##### //

// Adopted from: https://reactcommunity.org/react-modal/examples/css_classes.html

import React from 'react'
import ReactModal from 'react-modal'

class ModalComp extends React.Component {
  constructor () {
    super();
    this.state = {
      showModal: false
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
      <div className="c-modal">
        {/* onClick element below can be a button or link */}
        <button onClick={this.handleOpenModal}>Trigger Modal</button>
        <ReactModal 
           isOpen={this.state.showModal}
           contentLabel="onRequestClose Example"
           onRequestClose={this.handleCloseModal}
           className="c-modal--open"
           overlayClassName="c-modal__overlay"
        >
          <div className="modal__header">
            <h2>Modal Heading</h2>
          </div>
          <div className="modal__content">
            Modal content goes here.
          </div>
          <div className="c-modal__footer">
            <button className="c-modal__button-close" onClick={this.handleCloseModal}>Cancel</button>
            <button className="o-button__7">Clear All</button>
            <button className="o-button__3">Select</button>
          </div>
        </ReactModal>
      </div>
    )
  }
}

module.exports = ModalComp;
