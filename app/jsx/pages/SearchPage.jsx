
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
    var searchString = 'Your search: "' + this.props.query.q + '"'
    return (
      <div className="currentSearchTerms">
        <h3>{searchString}</h3>
        <input type="hidden" name="q" value={this.props.query.q} />
        <p>Results: {this.props.count} works</p>
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
    if (data) { return(
      <div>
        <HeaderComp />
        <NavComp />
        <SearchResultsSidebar facets={data.facets} query={this.props.location.query} count={data.count} />
        <SearchResultsSet results={data.searchResults} />
      </div>
    )} else { return(
      <div>
        {this.renderHeader()}
        {this.renderNav()}
        <h2 style={{ marginTop: "5em", marginBottom: "5em" }}>Error retrieving search results.</h2>
      </div>
    )}
  }
}

module.exports = SearchPage;
