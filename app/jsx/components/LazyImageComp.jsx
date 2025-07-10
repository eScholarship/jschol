// ##### Lazy Image Component ##### //

// NOTE:
// chrome is very efficient for a small quantity of images, so loading='lazy' doesn't always work
// however, doing it this way eliminates the need for external dependencies 

import React from 'react'

class LazyImageComp extends React.Component {
  handleImageLoad = e => {
    const image = e.target
    image.setAttribute('data-loaded', 'true')
  }

  render() {
    const { src, alt, clickable } = this.props

    const imgElement = (
      <img
        className='c-lazyimage'
        loading='lazy'
        src={src}
        alt={alt}
        onLoad={this.handleImageLoad}
      />
    )

    return clickable ? (
      <a href={src} target='_blank'>
        {imgElement}
      </a>
    ) : (
      imgElement
    )
  }
}

export default LazyImageComp;