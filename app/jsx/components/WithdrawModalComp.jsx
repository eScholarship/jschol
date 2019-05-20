// ##### Withdraw Modal Component ##### //

import React from 'react'
import ReactModal from 'react-modal'
import Contexts from '../contexts.jsx'

class WithdrawModalComp extends React.Component {
  state = { modalOpen: false, inProgress: false }

  onClose = () => this.setState({modalOpen: false, inProgress: false})
  onOpen = () => this.setState({modalOpen: true, message: null, redirectTo: null})
  onOK = () => {
    this.props.sendApiData('DELETE', `/api/item/qt${this.props.itemID}`,
      { publicMessage: this.state.publicMessage,
        internalComment: this.state.internalComment,
        redirectTo: this.state.redirectTo })
    this.onClose()
  }

  render() {
    return (
      <Contexts.CMS.Consumer>
        { cms =>
          (cms.loggedIn && cms.permissions && cms.permissions.super) ?
          <div>
            <button className="o-button__3" onClick={this.onOpen}>Withdraw</button>
            <div className="c-modal">
              <ReactModal
                isOpen={this.state.modalOpen}
                contentLabel="Withdraw Item"
                onRequestClose={this.onClose}
                className="c-modal--open"
                overlayClassName="c-modal__overlay"
              >
                <div className="modal__header">
                  <h2>Withdraw Item</h2>
                  <button className="c-modal__header-close" onClick={this.onClose}>
                    <span>Close</span>
                  </button>
                </div>
                <div className="modal__content">
                  <div className="c-withdrawmodal__warning">
                    <b>WARNING: </b> This item will be permanently withdrawn (and optionally redirected to another item).
                  </div>

                  <label className="c-withdrawmodal__label" htmlFor="publicMessage">
                    Withdrawal reason (public):
                  </label>
                  <input className="c-withdrawmodal__public-message" id="publicMessage" type="text"
                         onChange={ event => this.setState( { publicMessage: event.target.value }) }/>

                  <label className="c-withdrawmodal__label" htmlFor="internalComment">
                    Internal comment (optional, e.g. ticket URL):
                  </label>
                  <input className="c-withdrawmodal__internal-comment" id="internalComment" type="text"
                         onChange={ event => this.setState( { internalComment: event.target.value }) }/>

                  <label className="c-withdrawmodal__label" htmlFor="redirectTo">
                    Identifier of item to redirect to (optional, form of 'qtxxxxxxxx'):
                  </label>
                  <input className="c-withdrawmodal__redirect-to" id="redirectTo" type="text"
                         onChange={ event => this.setState( { redirectTo: event.target.value }) }/>
                </div>
                <div className="c-modal__footer">
                  <div>
                    <button className="c-modal__button-close" onClick={this.onClose}>Cancel, back to safety</button>
                    <button className="o-button__3" onClick={this.onOK}>Yes, withdraw this item</button>
                  </div>
                </div>
              </ReactModal>
            </div>
          </div>
          : null
        }
      </Contexts.CMS.Consumer>
    )
  }
}

module.exports = WithdrawModalComp;
