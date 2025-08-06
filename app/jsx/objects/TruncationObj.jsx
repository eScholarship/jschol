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
    lines: 1,
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
    
    const style = {
      '--line-clamp-lines': lines,
    }

    return React.createElement(element, {
      className: combinedClassName,
      style: style,
      children,
    })
  }
}
