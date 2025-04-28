// this component exists as a functional wrapper for PdfViewComp,
// since we want to use the resize observer hook

import React, { useState, useEffect, useCallback } from 'react'
import useResizeObserver from 'use-resize-observer'
import PdfViewComp from '../components/PdfViewComp.jsx'
import { debounce } from 'lodash'

const PdfViewWrapper = props => {
  const { ref, width = 1 } = useResizeObserver()
  const [debouncedWidth, setDebouncedWidth] = useState(width)

  // debounce and memoize the resize updates
  const debouncedSetWidth = useCallback(
    debounce(newWidth => {
      setDebouncedWidth(newWidth)
    }, 200), // every 200ms, dont need to update on every pixel change 
    []
  )
  
  // this effect is triggered when the width changes
  useEffect(() => {
    debouncedSetWidth(width)

    return () => {
      debouncedSetWidth.cancel()
    }
  }, [width, debouncedSetWidth])

  return <PdfViewComp {...props} containerWidth={debouncedWidth} viewerRef={ref} />
}

export default PdfViewWrapper
