// ##### Wrapper Component for the Trumbo WYSIWIG editor ##### //

import React from 'react'
import PropTypes from 'prop-types'
import getFormData from 'get-form-data'
import $ from 'jquery'
import { withRouter } from 'react-router'
import { FILTER_TYPES } from '../../consts/filters'

class FormComp extends React.Component {
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
      
      if (!data.start) { // when the page = 1, there's no start param
        params.delete('start')  // make sure we delete it from previous url
      }

      console.log(data)
    
      for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val)) {
          // if val is an array, add each unique value as a separate key-value pair
          // e.g. type_of_work=article&type_of_work=monograph
          val.forEach(v => {
            // only add the value if it doesn't already exist
            if (!params.getAll(key).includes(v)) {
              params.append(key, v)
            } 
          })

          FILTER_TYPES.forEach(filterType => {
            if (filterType === 'pub_year') {
              // ... handle this
            } else {
              if (!(data[filterType] ?? []).includes(val)) {
                params.delete(filterType) // FIXME remove a specific key/value pair when you use URLSearchParams.append
              }
            }
          })
          
        } else {
            // if it's not an array, set the param value
            params.set(key, val)
        }
      }
    
      console.log(params.toString())
 
      this.props.history.push(this.props.to + "?" + params.toString().replace(/%5B%5D/g, ""))

      // this.props.history.push(this.props.to + "?" + $.param(data).replace(/%5B%5D/g, ""))
      
    }
    
  }

  render = () =>
    <form id={this.props.id} onSubmit={this.onSubmit} ref={this.formEl} className={this.props.className}>
      {this.props.children}
    </form>
}
export default withRouter(FormComp);
