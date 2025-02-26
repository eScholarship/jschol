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
    if (this.props.filter) {
      data = this.props.filter(data)
    }
    
    if (this.props.onSubmit) {
      event.target.action = this.props.to
      this.props.onSubmit(event, data)
    } else {
      event.preventDefault()
      // we need this to get the current URL params, otherwise the data is lost when we navigate
      const params = new URLSearchParams(window.location.search)
  
      // pagination
      if (!data.start) params.delete('start') // if the page = 1, remove 'start' from the URL

      if (!data.rows) params.delete('rows')

      if (!data.sort) params.delete('sort')

      // handle parameters not in FILTER_TYPES
      for (const [key, val] of Object.entries(data)) {
        if (!FILTER_TYPES.includes(key)) { // if that key is not in FILTER_TYPES (e.g. q, rows, sort)
          if (!val) {
            params.delete(key)
          }
          params.set(key, val)
        }
      }
  
      // adding/removing filter types based on selections
      FILTER_TYPES.forEach(filterType => {
        // explicit check for pub_year, this is handled differently than other filters
        if (filterType === 'pub_year') {
          ['pub_year_start', 'pub_year_end'].forEach(key => {
            if (data[key]) {
              params.set(key, data[key])
            } else {
              params.delete(key)
            }
          })
        } else {
          const val = data[filterType]
    
          if (val) {
            if (Array.isArray(val)) {
              const selectedFilters = params.getAll(filterType)
              // if val is an array, add each unique value as a separate key-value pair
              // e.g. type_of_work=article&type_of_work=monograph
              val.forEach(v => {
                if (!selectedFilters.includes(v)) {
                  params.append(filterType, v) // e.g. append('type_of_work', 'article') if it's not in val
                }
              })
    
              const removedFilters = selectedFilters.filter(v => !val.includes(v))

              removedFilters.forEach(removedFilter => {
                params.delete(filterType, removedFilter) // remove deselected filters
              })
            } else {
              // if it's not an array, set the param value
              params.set(filterType, val)
            }
          } else {
            // if the filter type is not present in data, remove it from the URL
            params.delete(filterType)
          }
        }
      })
 
      this.props.history.push(this.props.to + "?" + params.toString().replace(/%5B%5D/g, ""))
    }
  }
  
  render = () =>
    <form id={this.props.id} onSubmit={this.onSubmit} ref={this.formEl} className={this.props.className}>
      {this.props.children}
    </form>
}
export default withRouter(FormComp);
