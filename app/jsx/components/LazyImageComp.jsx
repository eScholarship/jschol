// ##### Lazy Image Component ##### //

import React from 'react'
import lozad from 'lozad'

// A single observer is sufficient for all instances of LazyImageComp, and it doesn't
// really hurt anybody if it hangs around.
let observer = null

class LazyImageComp extends React.Component {
  componentDidMount() {
    // Don't try to do lazy loading on server side (lozad won't run there)
    if (typeof window !== "undefined") {
      if (!observer) {
        observer = lozad(".c-lazyimage")
        observer.observe()
      }

       // When running visual regression tests, load every image immediately
      if (navigator.userAgent === "puppeteer") {
        document.querySelectorAll(".c-lazyimage").forEach(el => observer.triggerLoad(el))
      }
    }
  }

  /* img 'src' attribute below gets added dynamically upon successful image load and will have the same value as 'data-src' */

  render() {
    const clickable = this.props.clickable || false;
    if (clickable) {
      return (
        <a href={this.props.src} target="_blank">
          <img className="c-lazyimage" data-src={this.props.src} alt={this.props.alt} />
        </a>
      );
    } else {
      return (
        <img className="c-lazyimage" data-src={this.props.src} alt={this.props.alt} />
      );
    }
  }
}

export default LazyImageComp;
