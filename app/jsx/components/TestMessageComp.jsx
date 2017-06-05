// ##### Test Message Component ##### //

import React from 'react'

class TestMessageComp extends React.Component {
  constructor(){
    super()
    this.state = {messageClose: false}
  }
  render() {
    return (
      <div className={this.state.messageClose ? "c-testmessage--close" : "c-testmessage"} role="alert" hidden={this.state.messageClose ? true : false}>
        <strong className="c-testmessage__main-text">New Website In Progress</strong>
        <div className="c-testmessage__more-info">
          {/* optional informational text would go here */}
        </div>
        <button className="c-testmessage__button" onClick = {()=> this.setState({messageClose: true})}>Got it!</button>
      </div>
    )
  }
}

module.exports = TestMessageComp;
