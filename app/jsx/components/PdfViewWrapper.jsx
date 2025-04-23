// this component exists as a functional wrapper for PdfViewComp,
// since we want to use the resize observer hook

import React from 'react'
import useResizeObserver from 'use-resize-observer'
import PdfViewComp from '../components/PdfViewComp.jsx'

const PdfViewWrapper = (props) => {
  const { ref, width = 1 } = useResizeObserver()
  console.log('resize width', width)

  return <PdfViewComp {...props} containerWidth={width} viewerRef={ref} />
}

export default PdfViewWrapper
