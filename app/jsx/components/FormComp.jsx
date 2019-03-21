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
    to: PropTypes.string.isRequired,
    className: PropTypes.string.isRequired,
    filter: PropTypes.func
  }

  formEl = React.createRef()

  onSubmit = (event) => {
    event.preventDefault()
    let data = getFormData(this.formEl.current)
    if (this.props.filter)
      data = this.props.filter(data)
    this.props.history.push(this.props.to + "?" + $.param(data))
  }

  render = () =>
    <form id={this.props.id} onSubmit={this.onSubmit} ref={this.formEl} className={this.props.className}>
      {this.props.children}
    </form>
}

module.exports = withRouter(FormComp);
