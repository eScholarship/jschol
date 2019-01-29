// ##### Withdraw Modal Component ##### //

import React from 'react'
import ReactModal from 'react-modal'
import { Subscriber } from 'react-broadcast'

class WithdrawModalComp extends React.Component {
  state = { modalOpen: false }

  onClose = () => this.setState({modalOpen: false})
  onOpen = () => this.setState({modalOpen: true, message: null, redirectTo: null})
  onOK = () => {
    console.log(`message=${this.state.message}`)
    console.log(`redirectTo=${this.state.redirectTo}`)
    this.props.sendApiData('DELETE', `/api/item/qt${this.props.itemID}`,
      { message: this.state.message, redirectTo: this.state.redirectTo })
  }

  render() {
    return (
      <Subscriber channel="cms">
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
                    <b>WARNING</b>
                    <br/>
                    This item will be permanently withdrawn (and optionally redirected to another item).
                  </div>
                  <label className="c-withdrawmodal__label" htmlFor="unitName">Withdrawal message:</label>
                  <input className="c-withdrawmodal__message" id="message" type="text"
                         onChange={ event => this.setState( { message: event.target.value }) }/>
                  <label className="c-withdrawmodal__label" htmlFor="unitName">Redirect to item (optional, form of 'qtxxxxxxxx'):</label>
                  <input className="c-withdrawmodal__redirectTo" id="redirectTo" type="text"
                         onChange={ event => this.setState( { redirectTo: event.target.value }) }/>
                </div>
                <div className="c-modal__footer">
                  <button className="c-modal__button-close" onClick={this.onClose}>Cancel, back to safety</button>
                  <button className="o-button__3" onClick={this.onOK}>Yes, withdraw this item</button>
                </div>
              </ReactModal>
            </div>
          </div>
          : null
        }
      </Subscriber>
    )
  }
}

module.exports = WithdrawModalComp;
