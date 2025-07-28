import React from 'react'
import PropTypes from 'prop-types'

export default class SSRMetaTags extends React.Component {
  static propTypes = {
    children: PropTypes.node
  }

  componentDidMount() {
    // On client-side, actually update the document head
    if (typeof document !== 'undefined') {
      this.updateDocumentHead()
    }
  }

  componentDidUpdate() {
    if (typeof document !== 'undefined') {
      this.updateDocumentHead()
    }
  }

  updateDocumentHead() {
    // Remove existing meta tags that we manage
    const existingTags = document.querySelectorAll('[data-ssr-meta]')
    existingTags.forEach(tag => tag.remove())

    // Add new meta tags
    React.Children.forEach(this.props.children, (child) => {
      if (React.isValidElement(child)) {
        const element = document.createElement(child.type)
        
        // Copy all props as attributes
        Object.keys(child.props).forEach(key => {
          if (key !== 'children' && child.props[key] != null) {
            element.setAttribute(key, child.props[key])
          }
        })
        
        // Add our marker
        element.setAttribute('data-ssr-meta', 'true')
        
        // Add text content for title tags
        if (child.type === 'title' && child.props.children) {
          element.textContent = child.props.children
          document.title = child.props.children
        }
        
        // Append to head
        if (child.type === 'title') {
          // Replace existing title
          const existingTitle = document.querySelector('title')
          if (existingTitle) {
            existingTitle.remove()
          }
          document.head.appendChild(element)
        } else {
          document.head.appendChild(element)
        }
      }
    })
  }

  render() {
    // On server-side, collect meta tags for SSR
    if (typeof window === 'undefined' && this.context && this.context.metaTags) {
      React.Children.forEach(this.props.children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === 'title') {
            this.context.metaTags.add(`<title>${child.props.children}</title>`)
          } else {
            const attrs = Object.keys(child.props)
              .filter(key => key !== 'children' && child.props[key] != null)
              .map(key => `${key}="${child.props[key]}"`)
              .join(' ')
            this.context.metaTags.add(`<${child.type} ${attrs} />`)
          }
        }
      })
    }

    // Don't render anything in the component tree
    return null
  }
}

SSRMetaTags.contextTypes = {
  metaTags: PropTypes.object
} 