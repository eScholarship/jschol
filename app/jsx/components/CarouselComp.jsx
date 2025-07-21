// ##### Campus Carousel Component ##### //

import React from 'react'
import ReactDOMServer from 'react-dom/server'
import PropTypes from 'prop-types'
import $ from 'jquery'

// TODO:
// figure out how to dynamically import flickity 

// Only load flickity when in the browser (not server-side)
let Flickity

if (!import.meta.env.SSR) {
  import('flickity-imagesloaded').then(mod => {
    Flickity = mod.default || mod
  })
}

class CarouselComp extends React.Component {
  componentDidMount() {
    try {
      this.flkty = new Flickity(this.domEl, this.props.options)
    }
    catch (e) {
      console.log("Exception initializing flickity:", e)
    }
    if (this.props.truncate) {
      let cells = $(this.domEl).find(this.props.truncate)
      $(this.domEl).find(this.props.truncate).each(function() {
        $(this).dotdotdot({
          watch: 'window',
        })
      })
    }
  }

  componentDidUpdate(prevProps) {
    try {
      if (this.flkty) {
        this.flkty.destroy();
      }
      this.flkty = new Flickity(this.domEl, this.props.options)
    }
    catch (e) {
      console.log("Exception re-initializing flickity:", e)
    }
  }

  componentWillUnmount() {
    try {
      if (this.flkty)
        this.flkty.destroy();
    }
    catch (e) {
      console.log("Exception destroying flickity:", e)
    }
  }

  static propTypes = {
    className: PropTypes.string.isRequired,
    options: PropTypes.object.isRequired,
  }
  render() {
    // The 'dangerouslySetInnerHTML' rigarmarole below is to keep React from attaching event handlers
    // to the children, because after Flickity takes over those children, the handlers otherwise become
    // confused and put out warnings to the console.
    return (
      <div className={this.props.className} ref={ el => this.domEl = el }
        dangerouslySetInnerHTML={{__html: ReactDOMServer.renderToStaticMarkup(
          <div >{this.props.children}</div>).replace(/^<div>/, '').replace(/<\/div>$/, '')}}/>
    )
  }
}

export default CarouselComp;
