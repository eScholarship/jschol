// ##### Modal Component ##### //

// Adopted from: https://reactcommunity.org/react-modal/examples/css_classes.html

import React from 'react'
import ReactModal from 'react-modal'

class ModalComp extends React.Component {
  render() {

    return (
      <ReactModal isOpen={this.props.isOpen}
        parentSelector={this.props.parentSelector}
        contentLabel="onRequestClose Example"
        onRequestClose={this.props.onCancel}
        className="c-modal--open"
        overlayClassName="c-modal__overlay">
        <div className="modal__header">
          <h2>{this.props.header}</h2>
        </div>
        <div className="modal__content">
          {this.props.content}
        </div>
        <div className="c-modal__footer">
          {this.props.onCancel &&
            <button className="c-modal__button-close" onClick={this.props.onCancel}>Cancel</button>}
          <button className="o-button__3" onClick={this.props.onOK}>{this.props.okLabel}</button>
        </div>
      </ReactModal>
    )
  }
}

export default ModalComp;
