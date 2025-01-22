// ##### Notification Component ##### //
import React from 'react'
class NotificationComp extends React.Component {
  constructor(){
    super()
    this.state = {messageClose: false}
  }
  render() {
    return (
      <div className={this.state.messageClose ? "c-notification--close" : "c-notification"} role="alert" hidden={this.state.messageClose ? true : false}>
        <strong className="c-notification__main-text"></strong>
      </div>
    )
  }
}
export default NotificationComp;