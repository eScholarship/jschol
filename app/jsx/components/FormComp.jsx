// ##### Wrapper Component for the Trumbo WYSIWIG editor ##### //

import React from 'react'
import PropTypes from 'prop-types'
import getFormData from 'get-form-data'
import $ from 'jquery'
import { withRouter } from 'react-router'

class FormComp extends React.Component
{
  static propTypes = {
    to: PropTypes.string.isRequired,
    className: PropTypes.string.isRequired
  }

  formEl = React.createRef()

  onSubmit = (event) => {
    event.preventDefault()
    this.props.history.push(this.props.to + "?" + $.param(getFormData(this.formEl.current)))
  }

  render = () =>
    <form onSubmit={this.onSubmit} ref={this.formEl} className={this.props.className}>
      {this.props.children}
    </form>
}

module.exports = withRouter(FormComp);
