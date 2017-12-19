// Adapted from react-router page https://reacttraining.com/react-router/web/guides/scroll-restoration

import React from 'react'
import { withRouter } from 'react-router'

class ScrollToTopComp extends React.Component {
  componentDidUpdate(prevProps) {
    let this_search = this.props.location.search
    let prev_search = prevProps.location.search
    if (this.props.location.pathname !== prevProps.location.pathname ||
      (this_search.includes("start") && !this_search.includes("start=0") && this_search !== prev_search)) {
      window.scrollTo(0, 0)
    }
  }

  render() {
    return this.props.children
  }
}

export default withRouter(ScrollToTopComp)
