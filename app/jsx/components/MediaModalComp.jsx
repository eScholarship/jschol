// ##### Media Modal Component ##### //

import React from 'react'
import ReactModal from 'react-modal'

class MediaModalComp extends React.Component {
  render() {
    return (
      <div className="c-modal">
        <ReactModal 
          isOpen={this.props.showModal}
          contentLabel="onRequestClose Example"
          onRequestClose={this.props.handleCloseModal}
          className="c-modal--open"
          overlayClassName="c-modal__overlay"
        >
          <div className="modal__header">
            <button className="c-modal__header-close" onClick={this.props.handleCloseModal}><span>Close</span></button>
          </div>
          <div className="modal__content">
            {this.props.children}
          </div>
        </ReactModal>
      </div>
    )
  }
}

module.exports = MediaModalComp;
