// ##### Filter Component ##### //

import React from 'react'
import _ from 'lodash'

class FilterComp extends React.Component {
  clearAll = (event) => {
    $('[name=start]').val('0');
    let filters = $(':checked').prop('checked', false);
  }

  render() {
    let searchString = 'Your search: "' + this.props.query.q + '"',
        activeFilters = null

    if (!(_.isEmpty(this.props.query['filters']))) {
      let filterTypes = ['type_of_work', 'peer_reviewed', 'supp_file_types', 'pub_year', 'campuses', 'departments', 'journals', 'disciplines', 'rights'];
      activeFilters = [];
      for (let filterType of filterTypes) {
        if (this.props.query['filters'][filterType] && this.props.query['filters'][filterType]['filters'].length > 0) {
          let displayNames = this.props.query['filters'][filterType]['filters'].map(function(filter) {
            if ('displayName' in filter) {
              return filter['displayName'];
            } else {
              return filter['value'];
            }
          });
          activeFilters.push({'filterDisplay': this.props.query['filters'][filterType]['display'], 'filters': displayNames.join(", "), 'filterType': filterType});
        }
      }
    }

    return (
      <div className={activeFilters ? "c-filter--active" : "c-filter"}>
        <h2 className="c-filter__heading">{searchString}</h2>
        <input type="hidden" name="q" value={this.props.query.q} />
        <div className="c-filter__results">Results: 12 pages, {this.props.count} works</div>
        <div className="c-filter__inactive-note">No filters applied</div>
        <details className="c-filter__active">
          <summary><span><strong>{activeFilters && activeFilters.length}</strong> filter{!activeFilters || activeFilters.length != 1 ? "s" : ""} applied</span></summary>
          <button className="c-filter__clear-all" onClick={this.clearAll}>clear all</button>
          <ul className="c-filter__active-list">
            { activeFilters && activeFilters.map(filter =>
              <li key={filter.filterType}><button onClick={this.props.handler} data-filter-type={filter.filterType}>{filter.filterDisplay} ({filter.filters})</button></li>
            ) }
          </ul>
        </details>
        {/* <a href="" className="c-filter__tips">Search tips</a> */}
      </div>
    )
  }
}

module.exports = FilterComp;
