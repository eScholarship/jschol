// Adapted from react-router page https://reacttraining.com/react-router/web/guides/scroll-restoration

import React from 'react'
import { withRouter } from 'react-router'

class ScrollToTopComp extends React.Component {
  componentDidUpdate(prevProps) {
    //console.log("nextLoc:", this.props.location)
    if (this.props.location.pathname !== prevProps.location.pathname) {
      window.scrollTo(0, 0)
    }
  }

  render() {
    return this.props.children
  }
}

export default withRouter(ScrollToTopComp)
