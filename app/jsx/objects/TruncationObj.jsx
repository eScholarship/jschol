// ##### Dotdotdot Truncation Object ##### //

import React from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'

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
    if (n > 0)
      console.log("Processed " + n + " in " + (new Date() - start) + " sec.")
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
    job_queue.append(()=>{
      if (this.domEl) {
        $(this.domEl).dotdotdot(this.props.options ? this.props.options : {watch:"window"})
        job_queue.append(()=>this.domEl && $(this.domEl).trigger("update"))
      }
    })
  }

  componentWillUnmount() {
    this.domEl = null
  }

  render = () =>
    React.createElement(this.props.element, { className: this.props.className, ref: el => this.domEl = el }, this.props.children)
}

module.exports = TruncationObj
