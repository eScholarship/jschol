// ##### NotYetLink Component (temporary modal for for functionality/pages that are "Coming Soon") ##### //

import React from 'react'
import ModalComp from '../components/ModalComp.jsx'

class NotYetLink extends React.Component {
  state = { modalOpen: false }

  closeModal = e => {
    this.setState({modalOpen:false})
  }

  content = (<div>Ahem...This page or functionality is not yet working.<br/>We appreciate your patience.</div>)

  render() {
    return (
      <div id="notYetLinkModalBase">
        <a href="" onClick={(event)=>{
          this.setState({modalOpen:true})
          event.preventDefault()}}>
          {this.props.children}
        </a>
        <ModalComp isOpen={this.state.modalOpen}
          parentSelector={()=>$("#notYetLinkModalBase")[0]}
          header="Sorry!"
          content={this.content}
          onOK={e=>this.closeModal(e)} okLabel="OK" />
      </div>
    )
  }
}

module.exports = NotYetLink;
