// ##### Campus Carousel Component ##### //

import React, { useRef, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import Flickity from 'react-flickity-component'

/*
- we primarily use flickity to render a multi-item, scrollable list of links
- flickity applies "aria-hidden" to non-selected slides and manages focus around the active item
- the code below is a workaround to remove the aria-hidden attribute from the items after they are loaded/re-applied,
so that they can be announced by screen readers when tabbed through

TODO:
- a scrollable list pattern is probably a better fit for many of our use cases (e.g. StatsCarouselComp)
*/

const CarouselComp = ({ className, options, imagesLoaded = true, children }) => {
  const flickityRef = useRef(null)
  const observerRef = useRef(null)

  const handleFlickityRef = useCallback(flkty => {
    flickityRef.current = flkty
    if (!flkty || !flkty.element) return

    flkty.element.setAttribute('role', 'region')
    flkty.element.setAttribute('aria-roledescription', 'carousel')

    // Flickity sets aria-hidden="true" on non-selected cells during init,
    // on every select event, and after cell reloads 
    // a MutationObserver strips it immediately regardless of when or why Flickity adds it
    if (observerRef.current) observerRef.current.disconnect()

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.target.hasAttribute('aria-hidden')) {
          mutation.target.removeAttribute('aria-hidden')
        }
      }
    })

    const slider = flkty.element.querySelector('.flickity-slider')
    if (slider) {
      observer.observe(slider, {
        attributes: true,
        attributeFilter: ['aria-hidden'],
        subtree: true,
      })
    }

    observerRef.current = observer

    // apply slide semantics
    const labelCells = () => {
      const cells = flkty.element.querySelectorAll('.flickity-slider > *')
      cells.forEach((cell, i) => {
        cell.setAttribute('role', 'group')
        cell.setAttribute('aria-roledescription', 'slide')
        cell.setAttribute('aria-label', `${i + 1} of ${cells.length}`)
      })
    }

     // re-apply on select to cover any cells added after init
    labelCells()
    flkty.on('select', labelCells)
  }, [])

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [])

  return (
    <Flickity
      className={className}
      options={options}
      disableImagesLoaded={!imagesLoaded}
      flickityRef={handleFlickityRef}
    >
      {children}
    </Flickity>
  )
}

CarouselComp.propTypes = {
  className: PropTypes.string.isRequired,
  options: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
}

export default CarouselComp
