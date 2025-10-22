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
    // expandable mode props
    expandable: PropTypes.bool,
    buttonClassName: PropTypes.string,
    buttonText: PropTypes.shape({
      more: PropTypes.string,
      less: PropTypes.string
    })
  }

  static defaultProps = {
    className: '',
    lines: null, // auto-calculate from CSS
    expandable: false,
    buttonClassName: 'o-button__7',
    buttonText: {
      more: 'More',
      less: 'Less'
    }
  }

  state = {
    isExpanded: false,
    isTruncated: false
  }

  elementRef = React.createRef()

  componentDidMount() {
    this.updateLineClamp()
    if (this.props.expandable) {
      this.checkTruncation()
      // add resize listener for responsive truncation detection
      window.addEventListener('resize', this.handleResize)
    }
  }

  componentDidUpdate(prevProps, prevState) {
    this.updateLineClamp()
    
    if (this.props.expandable) {
      // recheck if content changes or expansion state changes
      if (prevProps.children !== this.props.children || 
          prevState.isExpanded !== this.state.isExpanded) {
        this.checkTruncation()
      }
    }
  }

  componentWillUnmount() {
    if (this.props.expandable) {
      window.removeEventListener('resize', this.handleResize)
    }
  }

  handleResize = () => {
    // debounce resize events
    clearTimeout(this.resizeTimeout)
    this.resizeTimeout = setTimeout(() => {
      this.checkTruncation()
    }, 150)
  }

  checkTruncation = () => {
    if (this.state.isExpanded) return
    
    // small delay to ensure content is rendered
    setTimeout(() => {
      if (this.elementRef.current) {
        const isTruncated = this.elementRef.current.scrollHeight > this.elementRef.current.clientHeight
        this.setState({ isTruncated })
      }
    }, 0)
  }

  toggleExpanded = () => {
    this.setState(prevState => ({ isExpanded: !prevState.isExpanded }))
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
    const { children, element, className, lines, expandable, buttonClassName, buttonText } = this.props
    const { isExpanded, isTruncated } = this.state

    // render children to a string ONLY to check for MathJax content
    const contentString = ReactDOMServer.renderToStaticMarkup(<>{children}</>)

    // do NOT truncate if we detect MathJax delimiters: \\(  \\[  $$
    const hasMathJax = /\\\(|\\\[|\$\$/.test(contentString)

    if (hasMathJax) {
      // if MathJax is present, render without truncation
      return React.createElement(element, { className }, children)
    }

    // for expandable mode, conditionally apply truncation class
    const truncationClass = (expandable && isExpanded) ? '' : 'u-truncate-lines'
    const combinedClassName = `${className} ${truncationClass}`.trim()
    
    // if lines is explicitly set, use it, otherwise calculate it
    const style = lines !== null ? {
      '--line-clamp-lines': lines,
    } : undefined

    const contentElement = React.createElement(element, {
      className: combinedClassName,
      style: style,
      ref: this.elementRef,
      children,
    })

    // if not expandable, just return the content element
    if (!expandable) return contentElement

    // if expandable, wrap with button
    // show button if content is truncated OR if it's currently expanded
    return (
      <>
        {contentElement}
        {(isTruncated || isExpanded) && (
          <button 
            className={buttonClassName}
            onClick={this.toggleExpanded}
          >
            {isExpanded ? buttonText.less : buttonText.more}
          </button>
        )}
      </>
    )
  }
}
