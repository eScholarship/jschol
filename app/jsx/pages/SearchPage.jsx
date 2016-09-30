
import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router'
import Form from 'react-router-form'

import PageBase from './PageBase.jsx'
import { HeaderComp, NavComp, FooterComp } from '../components/AllComponents.jsx'

class FacetItem extends React.Component {
  // TODO: a bit of a hack - was unsure how to manually submit the Form component,
  // calling $(#facetForm).submit does things the normal way (full page request)
  // because it's submitting the DOM <form> element, not the react Form component instance
  // this submits the Form component instance by manually clicking on the submit button

  // TODO: related to above - in general, query state is currently still managed by the DOM,
  // Currently, results and facets are all that is managed by 'state' and 'props'
  // I began moving towards a query JSON obj that gets returned by the API (data.query in SearchPage component)
  // but this object needs to get integrated into the state for this page,
  // and the appropriate handlers need to be written for changes to the query state in the DOM
  // those handlers will have to manually use react-router to push history

  handleChange() {
    $('#facet-form-submit').click();
  }

  render() {
    var label = this.props.data.displayName ? this.props.data.displayName : this.props.data.value
    return (
      <div className="facetItem">
        <label htmlFor={this.props.value}>{label}</label>
        <input name={this.props.facetType} value={this.props.data.value} type="checkbox" onChange={this.handleChange} /> ({this.props.data.count})
      </div>
    )
  }
}

class FacetFieldset extends React.Component {
  render() {
    var facetItemNodes = this.props.data.facets.map(function(facetType) {
      return function(facet) {
        return (
          <FacetItem key={facet.value} data={facet} facetType={facetType} />
        )
      }
    }(this.props.data.fieldName));

    return (
      <fieldset className={this.props.data.fieldName}>
        <legend>{this.props.data.display}</legend>
        <div className="facetItems">
          {facetItemNodes}
        </div>
      </fieldset>
    )
  }
}

class CurrentSearchTerms extends React.Component {
  render() {
    var searchString = 'Your search: "' + this.props.query.q + '"';
    var filterTypes = ['type_of_work', 'peer_reviewed', 'supp_file_types', 'campuses', 'journals', 'disciplines', 'rights']
    var activeFilters = []
    for (let filterType of filterTypes) {
      if (this.props.query['filters'][filterType]['filters'].length > 0) {
        var displayNames = this.props.query['filters'][filterType]['filters'].map(function(filter) {
          return filter['displayName'];
        });
        activeFilters.push({'filterType': filterType, 'filters': displayNames.join(" ")});
      }
    }

    return (
      <div className="currentSearchTerms">
        <h3>{searchString}</h3>
        <input type="hidden" name="q" value={this.props.query.q} />
        <p>Results: {Math.ceil(this.props.count/10)} pages, {this.props.count} works</p>
        <p>Active filters:</p>
        <ul>
          { activeFilters.map(function(filter) {
            return (
              <li>{filter.filterType} ({filter.filters})</li>
            )
          }) }
        </ul>
      </div>
    )
  }
}

class FacetForm extends React.Component {
  render() {
    var facetForm = this.props.data.map(function(fieldset) {
      return (
        <FacetFieldset key={fieldset.fieldName} data={fieldset} />
      )
    });

    return (
			<Form id="facetForm" to='/search' method="GET">
        <CurrentSearchTerms query={this.props.query} count={this.props.count} />
        {facetForm}
				<button type="submit" id="facet-form-submit">Search</button>
      </Form>
    )
  }
}

class SearchResultsSidebar extends React.Component {
  render() {
    return (
      <div className="searchResultsSidebar" style={{width: "25%", float: "left"}}>
        <FacetForm data={this.props.facets} query={this.props.query} count={this.props.count} />
      </div>
    )
  }
}

class ResultItem extends React.Component {
  render() {
    return (
      <div className="resultItem">
        <ol>
          <li>Genre: {this.props.result.genre}</li>
          <li>Peer Reviewed: {this.props.result.peerReviewed}</li>
          <li>CC License: {this.props.result.rights}</li>
          <li>Thumbnail: ???</li>
          <li>Title: <a href={this.props.result.id}>{this.props.result.title}</a></li>
          <li>Authors: ???</li>
          <li>Journal Info: ???</li>
          <li>Year: {this.props.result.pub_date}</li>
          <li>Abstract: {this.props.result.abstract}</li>
          <li>Supplemental items: ???</li>
        </ol>
      </div>
    )
  }
}

class SearchResultsSet extends React.Component {
  render() {
    var resultNodes = this.props.results.map(function(result) {
      return (
        <ResultItem key={result.id} result={result} />
      );
    });

    return (
      <div className="searchResultsSet" style={{width: "75%", float: "left"}}>
        <h2>Research</h2>
        {resultNodes}
      </div>
    )
  }
}

class SearchPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL(props) {
    return "/api/search/" + props.location.search  // plus whatever props.params.YourUrlParam, etc.
  }

  render() { return(
    <div>
      { this.state.pageData ? this.renderData(this.state.pageData) : <div>Loading...</div> }
      <FooterComp />
    </div>
  )}

  renderData(data) {
    return(
      <div>
        <HeaderComp />
        <NavComp />
        <SearchResultsSidebar facets={data.facets} query={data.query} count={data.count} />
        <SearchResultsSet results={data.searchResults} />
      </div>
  )}
}

module.exports = SearchPage;
