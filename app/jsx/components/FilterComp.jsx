// ##### Filter Component ##### //

import React from 'react'

class FilterComp extends React.Component {
  clearAll(event) {
    $('[name=start]').val('0');
    var filters = $(':checked').prop('checked', false);
  }
  
  render() {
    var searchString = 'Your search: "' + this.props.query.q + '"';
    var filters;
    
    if (!(_.isEmpty(this.props.query['filters']))) {
      var filterTypes = ['type_of_work', 'peer_reviewed', 'supp_file_types', 'pub_year', 'campuses', 'departments', 'journals', 'disciplines', 'rights'];
      var activeFilters = [];
      for (let filterType of filterTypes) {
        if (this.props.query['filters'][filterType] && this.props.query['filters'][filterType]['filters'].length > 0) {
          var displayNames = this.props.query['filters'][filterType]['filters'].map(function(filter) {
            if ('displayName' in filter) {
              return filter['displayName'];
            } else {
              return filter['value'];
            }
          });
          activeFilters.push({'filterDisplay': this.props.query['filters'][filterType]['display'], 'filters': displayNames.join(", "), 'filterType': filterType});
        }
      }

      filters = (
        <div>
          <div className="c-filter__active-header">
            <span id="c-filter__active-title">Active filters:</span>
            <button onClick={this.clearAll}>clear all</button>
          </div>
          <div role="group" aria-labelledby="c-filter__active-title" className="c-filter__active">
            { activeFilters.map((filter) => {
              return (
                <button key={filter.filterType} onClick={this.props.handler} data-filter-type={filter.filterType}>{filter.filterDisplay} ({filter.filters})</button>
              )
            }) }
          </div>
        </div>
      );
    }
    
    return (
      <div className="c-filter">
        <h2 className="c-filter__heading">{searchString}</h2>
        <input type="hidden" name="q" value={this.props.query.q} />
        <div>Results: {Math.ceil(this.props.count/10)} pages, {this.props.count} works</div>
        {filters}
        <a href="" className="c-filter__tips">search tips</a>
      </div>
    )
  }
}

module.exports = FilterComp;
