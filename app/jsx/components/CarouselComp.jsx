// ##### Campus Carousel Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'

// Only load flickity when in the browser (not server-side)
if (!(typeof document === "undefined")) {
  var Flickity = require('flickity-imagesloaded')
}

class CarouselComp extends React.Component {
  componentDidMount() {
    this.flkty = new Flickity(this.domEl, this.props.options)
  }
  componentWillUnmount() {
    if (this.timer)
      clearTimeout(this.timer)
    if (this.flkty)
      this.flkty.destroy();
  }
  static propTypes = {
    className: PropTypes.string.isRequired,
    options: PropTypes.object.isRequired,
  }
  render() {
    return (
      <div className={this.props.className} ref={ el => this.domEl = el }>
        {this.props.children}
      </div>
    )
  }
}

module.exports = CarouselComp;
