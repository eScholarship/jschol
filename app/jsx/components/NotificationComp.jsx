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
        <strong className="c-notification__main-text">Notice: eScholarship will undergo scheduled maintenance from Tuesday, January 21 to Wednesday, January 22. Some functionality may not be available during this time. <a href="https://help.escholarship.org/support/discussions/topics/9000062987">Learn more at eScholarship Support.</a></strong>
      </div>
    )
  }
}
export default NotificationComp;