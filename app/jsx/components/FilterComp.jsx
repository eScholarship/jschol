// ##### Filter Component ##### //

import React from 'react'
import _ from 'lodash'
import unescape from 'lodash/unescape'
import { FILTER_TYPES as filterTypes } from '../../consts/filters'
class FilterComp extends React.Component {
  state = { isOpen: true }  // open only becomes false when user clicks it to hide (handled by CSS)

  clearAll = (event) => {
    $('[name=start]').val('0');
    let filters = $(':checked').prop('checked', false)
    $(':text').val('')
  }

  componentWillReceiveProps() {
    this.setState({isOpen: true})
  }

  render() {
    let searchString = 'Your search: "' + this.props.query.q + '"',
        activeFilters = null

    if (!(_.isEmpty(this.props.query['filters']))) {
      activeFilters = [];
      for (let filterType of filterTypes) {
        if (this.props.query['filters'][filterType] && this.props.query['filters'][filterType]['filters'].length > 0) {
          let displayNames = this.props.query['filters'][filterType]['filters'].map(function(filter) {
            if (filter['displayName']) {
              return filter['displayName'];
            } else {
              return filter['value'];
            }
          });
          
          activeFilters.push({
            'filterDisplay': this.props.query['filters'][filterType]['display'], 
            'filters': displayNames.join(", "), 
            'filterType': filterType,  
          });
        }
      }
    }

    let resultCount = (this.props.count + this.props.info_count ).toLocaleString()

    return (
      <div className={activeFilters ? "c-filter--active" : "c-filter"}>
        {/* we trust searchString (We have escaped the params already), this is fine */}
        <h1 className="c-filter__heading" dangerouslySetInnerHTML={{__html: searchString}} />
        <input type="hidden" name="q" value={this.props.query.q == "All items" ? "" : unescape(this.props.query.q)} />
        <div className="c-filter__results">{resultCount} results</div>
        <div className="c-filter__inactive-note">No filters applied</div>
        <details className="c-filter__active" open={this.state.isOpen}>
          <summary><span><strong>{activeFilters && activeFilters.length}</strong> filter{!activeFilters || activeFilters.length != 1 ? "s" : ""} applied</span></summary>
          <button className="c-filter__clear-all" onClick={this.clearAll}>clear all</button>
          <ul className="c-filter__active-list">
            { activeFilters && activeFilters.map(filter =>
              <li key={filter.filterType}><button onClick={this.props.handler} data-filter-type={filter.filterType}>{filter.filterDisplay} ({filter.filters})</button></li>
            ) }
          </ul>
        </details>
        <a href="https://help.escholarship.org/support/solutions/articles/9000148939-using-advanced-search-beta-" className="c-filter__tips">Search tips</a>
      </div>
    )
  }
}

export default FilterComp;
