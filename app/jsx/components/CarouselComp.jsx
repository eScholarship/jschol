// ##### Campus Carousel Component ##### //

import React from 'react'
import $ from 'jquery'

// Only load flickity when in the browser (not server-side)
if (!(typeof document === "undefined")) {
  var Flickity = require('flickity-imagesloaded')
}

class CarouselComp extends React.Component {
  componentDidMount () {
    // The forceUpdate and setTimeout below work around a problem with isomorphic
    // rendering. Basically, React has to fully recognize that the server's code
    // matches the client's before we init Flickity. Otherwise, we get a message
    // "Unable to find element with ID ##"
    this.forceUpdate()
    setTimeout(()=>{
      var carousel = this.domEl
      this.flkty = new Flickity(this.domEl, this.props.options);
    }, 0)
  }
  componentWillUnmount() {
    this.flkty.destroy();
  }
  static propTypes = {
    className: React.PropTypes.string.isRequired,
    options: React.PropTypes.object.isRequired,
  }
  render() {
    return (
      <div className={this.props.className} ref={ el=> this.domEl = el }>
        {this.props.children}
      </div>
    )
  }
}

module.exports = CarouselComp;
