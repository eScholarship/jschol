// ##### Wrapper Component for the Trumbo WYSIWIG editor ##### //

import React from 'react'
import PropTypes from 'prop-types'
import getFormData from 'get-form-data'
import $ from 'jquery'
import { withRouter } from 'react-router'

class FormComp extends React.Component
{
  static propTypes = {
    id: PropTypes.string,
    to: PropTypes.string,      // either 'to' ...
    onSubmit: PropTypes.func,  // ... or 'onSubmit' is needed
    className: PropTypes.string,
    filter: PropTypes.func
  }

  formEl = React.createRef()

  onSubmit = (event) => {
    let data = getFormData(this.formEl.current)
    if (this.props.filter)
      data = this.props.filter(data)
    if (this.props.onSubmit) {
      event.target.action = this.props.to
      this.props.onSubmit(event, data)
    }
    else {
      event.preventDefault()

      const params = new URLSearchParams(window.location.search)
      debugger
      // preserve previous data in url 
      for (const [k, v] of Object.entries(data)) {
        params.set(k, v)
      }
      this.props.history.push(this.props.to + "?" + params.toString().replace(/%5B%5D/g, ""))
      
    }
  }

  render = () =>
    <form id={this.props.id} onSubmit={this.onSubmit} ref={this.formEl} className={this.props.className}>
      {this.props.children}
    </form>
}

export default withRouter(FormComp);
