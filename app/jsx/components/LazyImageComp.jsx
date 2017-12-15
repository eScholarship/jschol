// ##### Lazy Image Component ##### //

import React from 'react'

// Don't try to do lazy loading on server side (lozad won't run there)
let lozad
if (!(typeof document === "undefined"))
  lozad = require('lozad')

// A single observer is sufficient for all instances of LazyImageComp, and it doesn't
// really hurt anybody if it hangs around.
let observer = null

class LazyImageComp extends React.Component {
  componentDidMount() {
    if (!(typeof document === "undefined")) {
      if (!observer)
        observer = lozad('.c-lazyimage');
      observer.observe();
    }
  }

  /* img 'src' attribute below gets added dynamically upon successful image load and will have the same value as 'data-src' */

  render() {
    return (
      <img className="c-lazyimage" data-src={this.props.src} alt={this.props.alt} />
    )
  }
}

module.exports = LazyImageComp;
