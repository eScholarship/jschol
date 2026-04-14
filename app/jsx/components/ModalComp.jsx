// ##### Modal Component ##### //

// Adopted from: https://reactcommunity.org/react-modal/examples/css_classes.html

import React from 'react'
import ReactModal from 'react-modal'

const ModalComp = ({ isOpen, header, content, onCancel, onOK, okLabel }) =>
  <ReactModal 
    isOpen={isOpen}
    contentLabel={header || "Dialog"}
    onRequestClose={onCancel}
    className="c-modal--open"
    overlayClassName="c-modal__overlay"
    aria={{ modal: true }}>
    <div className="modal__header">
      <h2>{header}</h2>
    </div>
    <div className="modal__content">
      {content}
    </div>
    <div className="c-modal__footer">
      {onCancel &&
        <button className="c-modal__button-close" onClick={onCancel}>Cancel</button>
      }
      <button className="o-button__3" onClick={onOK}>{okLabel}</button>
    </div>
  </ReactModal>

export default ModalComp;
