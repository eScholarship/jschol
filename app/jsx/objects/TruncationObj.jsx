// ##### Dotdotdot Truncation Object ##### //

import React from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'
import ReactDOMServer from 'react-dom/server'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

/**
  Well, jquery.dotdotdot is awesome, but takes time to process (doubly so on Firefox).
  So, we need to init dotdotdot in the background as time allows, to keep the page
  responsive for the user. That's what the queue below is all about.
*/

class JobQueue
{
  queue = []

  constructor() {
    setTimeout(this.service, 10)
  }

  append(job) {
    this.queue.push(job)
  }

  service = ()=>{
    let start = new Date()
    let n = 0
    while (this.queue.length > 0 && (new Date() - start) < 100) {
      let job = this.queue.shift()
      job()
      n++
    }
    setTimeout(this.service, 10)
  }
}

let job_queue = null
if (!(typeof document === "undefined")) {
  job_queue = new JobQueue(10) // timeslice of 10ms per iteration
}

export default class TruncationObj extends React.Component {
  static propTypes = {
    element: PropTypes.string.isRequired,
    options: PropTypes.object
  }

  componentDidMount() {
    // Don't do truncation on scripted tests (too hard to wait for completion)
    if (navigator.userAgent != "puppeteer" && this.truncate) {
      job_queue.append(()=>{
        if (this.domEl) {
          $(this.domEl).dotdotdot(this.props.options ? this.props.options : {watch:"window"})
          job_queue.append(()=>this.domEl && $(this.domEl).trigger("update"))
        }
      })
    }
  }

  componentWillUnmount() {
    this.domEl = null
  }

  render = () => {
    let content = ReactDOMServer.renderToStaticMarkup(
      <div >{this.props.children}</div>).replace(/^<div>/, '').replace(/<\/div>$/, '')

      // do NOT truncate if we detect MathJax, delimiters can be \\(  \\[  $$
      // only use test here... a match is slow/has a negative impact on performance
      if (/\\\(|\\\[|\$\$/.test(content)) { // heuristic to detect MathJax
        this.truncate = false
        return React.createElement(this.props.element,
          { className: this.props.className,
            ref: el => this.domEl = el,
          },
          this.props.children
        )
      } else {
        this.truncate = true
        return React.createElement(this.props.element,
          { className: this.props.className,
            ref: el => this.domEl = el,
            dangerouslySetInnerHTML: {__html: content}
          }
        )
      }
  }
}
