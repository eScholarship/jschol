// ##### Lazy Image Component ##### //

// NOTE:
// chrome is very efficient for a small quantity of images, so loading='lazy' doesn't always work
// however, using the native attribute eliminates the need for external dependencies 

import React, { useRef, useEffect } from 'react'

function LazyImageComp({ src, alt, clickable }) {
  const imgRef = useRef(null)

  useEffect(() => {
    const img = imgRef.current
    // if the image was already cached, the onLoad event fires before react
    // attaches its handler and is silently lost. check here as a fallback
    if (img?.naturalWidth > 0) {
      img.setAttribute('data-loaded', 'true')
    }
  }, [])

  const imgElement = (
    <img
      ref={imgRef}
      className='c-lazyimage'
      loading='lazy'
      src={src}
      alt={alt}
      onLoad={e => e.target.setAttribute('data-loaded', 'true')}
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

export default LazyImageComp;