// ##### CSS-based Truncation Object ##### //

import React from 'react';
import PropTypes from 'prop-types';
import ReactDOMServer from 'react-dom/server';

export default class TruncationObj extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    element: PropTypes.string.isRequired,
    className: PropTypes.string,
    lines: PropTypes.number,
  };

  static defaultProps = {
    className: '',
    lines: null, // auto-calculate from CSS
  }

  elementRef = React.createRef()

  componentDidMount() {
    this.updateLineClamp()
  }

  componentDidUpdate() {
    this.updateLineClamp()
  }

  updateLineClamp = () => {
    // only calculate if lines prop is not explicitly set and we have a ref
    if (this.props.lines !== null || !this.elementRef.current) return

    const element = this.elementRef.current
    const computedStyle = window.getComputedStyle(element)
    
    const maxHeight = parseFloat(computedStyle.maxHeight)
    let lineHeight = parseFloat(computedStyle.lineHeight)
    
    // if line-height is 'normal' or can't be parsed, estimate from font-size
    if (isNaN(lineHeight)) {
      const fontSize = parseFloat(computedStyle.fontSize)
      lineHeight = fontSize * 1.2
    }
    
    // only calculate if we have valid max-height, not 'none' or invalid
    if (maxHeight && lineHeight && !isNaN(maxHeight) && !isNaN(lineHeight)) {
      const calculatedLines = Math.floor(maxHeight / lineHeight)
      
      if (calculatedLines >= 1 && calculatedLines <= 20) {
        element.style.setProperty('--line-clamp-lines', calculatedLines)
      }
    }
  }

  render() {
    const { children, element, className, lines } = this.props

    // render children to a string ONLY to check for MathJax content
    const contentString = ReactDOMServer.renderToStaticMarkup(<>{children}</>)

    // do NOT truncate if we detect MathJax delimiters: \\(  \\[  $$
    const hasMathJax = /\\\(|\\\[|\$\$/.test(contentString)

    if (hasMathJax) {
      // if MathJax is present, render without truncation
      return React.createElement(element, { className }, children)
    }

    const truncationClass = 'u-truncate-lines'
    const combinedClassName = `${className} ${truncationClass}`.trim()
    
    // if lines is explicitly set, use it, otherwise calculate it
    const style = lines !== null ? {
      '--line-clamp-lines': lines,
    } : undefined

    return React.createElement(element, {
      className: combinedClassName,
      style: style,
      ref: this.elementRef,
      children,
    })
  }
}
