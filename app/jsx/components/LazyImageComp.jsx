// ##### Lazy Image Component ##### //

import React from 'react'
import lozad from 'lozad'

class LazyImageComp extends React.Component {
  constructor() {
    super();
    this.observer = lozad('.c-lazyimage');
  }

  componentDidMount() {
    this.observer.observe();
  }

  /* img 'src' attribute below gets added dynamically upon successful image load and will have the same value as 'data-src' */

  render() {
    return (
      <img className="c-lazyimage" data-src={this.props.src} alt={this.props.alt} />
    )
  }
}

module.exports = LazyImageComp;
