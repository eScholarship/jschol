
import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router'
import Form from 'react-router-form'

import PageBase from './PageBase.jsx'
import { HeaderComp, GlobalNavComp, FooterComp } from '../components/AllComponents.jsx'

class FacetItem extends React.Component {
  render() {
    var label = this.props.data.displayName ? this.props.data.displayName : this.props.data.value
    return (
      <div className="facetItem">
      <label>{label}</label>
      <input id={this.props.value} value={this.props.value} type="checkbox"/> ({this.props.data.count})
      </div>
    )
  }
}

class FacetFieldset extends React.Component {
  render() {
    var facetItemNodes = this.props.data.map(function(facetType) {
      return function(facet) {
        return (
          <FacetItem key={facet.value} data={facet} facetType={facetType} />
        )
      }
    }(this.props.key));

    return (
      <fieldset className={this.props.key}>
        <legend>{this.props.label}</legend>
        <div className="facetItems">
          {facetItemNodes}
        </div>
      </fieldset>
    )
  }
}

class FacetForm extends React.Component {
  render() {
    var facetForm = this.props.data.map(function(fieldset) {
      return (
        <FacetFieldset key={fieldset.fieldName} label={fieldset.display} data={fieldset.facets} />
      )
    });

    return (
			<Form to='/search' method="GET">
        {facetForm}
      </Form>
    )
  }
}

class SearchResultsSidebar extends React.Component {
  render() {
    var divStyle;
    return (
      <div className="searchResultsSidebar" style={{width: "25%", float: "left"}}>
        {this.props.query}
        <FacetForm data={this.props.facets} />
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
      <HeaderComp />
      <GlobalNavComp />
      { this.state.pageData ? this.renderData(this.state.pageData) : <div>Loading...</div> }
      <FooterComp />
    </div>
  )}

  renderData(data) {
    return(
      <div>
        <SearchResultsSidebar facets={data.facets} query={this.props.location.search} />
        <SearchResultsSet results={data.searchResults} />
      </div>
  )}
}

module.exports = SearchPage;
