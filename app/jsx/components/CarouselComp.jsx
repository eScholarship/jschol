// ##### Campus Carousel Component ##### //

// TODO:
// SSR handling (no errors currently)
// truncation

import React from 'react'
import PropTypes from 'prop-types'
import Flickity from 'react-flickity-component'

const CarouselComp = ({ className, options, truncate, imagesLoaded = true, children }) => {
  return (
    <Flickity
      className={className}
      options={options}
      disableImagesLoaded={!imagesLoaded}
    >
      {children}
    </Flickity>
  )
}

CarouselComp.propTypes = {
  className: PropTypes.string.isRequired,
  options: PropTypes.object.isRequired,
  truncate: PropTypes.string,
  children: PropTypes.node.isRequired,
}

export default CarouselComp
