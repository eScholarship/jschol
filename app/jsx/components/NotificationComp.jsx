// ##### Notification Component ##### //
import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'banner-dismissed-july-2026'

function NotificationComp({ children }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    setVisible(!dismissed)
  }, [])

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="c-notification" role="alert">
      <p>
        <strong className="c-notification__main-text">{children}</strong>
      </p>
      <a className="c-notification__close" role="button" aria-label="Close notification" onClick={handleClose}></a>
    </div>
  )
}

export default NotificationComp;