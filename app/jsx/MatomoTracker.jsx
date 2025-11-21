import { useEffect, useRef } from "react"
import { withRouter } from "react-router-dom"

function MatomoTracker({ location }) {
  const isInitialMount = useRef(true)

  useEffect(() => {
    // skip tracking on initial mount (handled by app.html)
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // track page view when route changes (SPA navigation)
    trackPageView()
  }, [location])

  function trackPageView() {
    if (typeof window === "undefined"|| !window._paq) return

    const currentUrl = `${location.pathname}${location.search}${location.hash}`
    const title = document.title

    window._paq.push(["setCustomUrl", currentUrl])
    window._paq.push(["setDocumentTitle", title])
    window._paq.push(["trackPageView"])
  }

  return null
}

export default withRouter(MatomoTracker)
