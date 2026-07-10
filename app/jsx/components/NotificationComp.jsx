// ##### Notification Component ##### //
import React, { useState } from 'react'

function NotificationComp({ children }) {
  const [messageClose, setMessageClose] = useState(false)
  return (
    <div className={messageClose ? "c-notification--close" : "c-notification"} role="alert" hidden={messageClose}>
      <p>
        <strong className="c-notification__main-text">{children}</strong>
      </p>
      <a className="c-notification__close" role="button" aria-label="Close notification" onClick={() => setMessageClose(true)}></a>
    </div>
  )
}

export default NotificationComp;