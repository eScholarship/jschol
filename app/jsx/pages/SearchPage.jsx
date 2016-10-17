
import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router'
import Form from 'react-router-form'

import PageBase from './PageBase.jsx'
import { HeaderComp, NavComp } from '../components/AllComponents.jsx'

class FacetItem extends React.Component {
  handleChange() {
    $('#facet-form-submit').click();
  }
  
  render() {
    var facet = this.props.data.facet;
    var label = facet.displayName ? facet.displayName : facet.value;

    if (facet.ancestor) {
      label = facet.ancestor.displayName
      if (facet.displayName) {
        label = label + " / " + facet.displayName
      }
      else {
        label = label + " / " + facet.value
      }
    }

    var descendents;
    if (facet.descendents) {
      descendents = facet.descendents.map( d => {
        var descendentItemData = {
          facetType: this.props.data.facetType,
          facet: d,
          checked: this.props.query && this.props.query.filters ? this.checkFacet(d) : false
        }
        return (<FacetItem key={d.value} data={descendentItemData} />)
      })
    }

    return (
      <div className="facetItem">
        <input id={facet.value} name={this.props.data.facetType} value={facet.value} type="checkbox" onChange={this.handleChange} className="c-checkbox__input" checked={this.props.data.checked} />
        <label htmlFor={facet.value} className="c-checkbox__label">{label} ({facet.count})</label>
        <div style={{paddingLeft: '30px'}}>{descendents}</div>
      </div>
    )
  }
}

class PubYear extends React.Component {
  //form submission on blur and enter
  handleChange(e) {
    console.log(e);
  }

  render() {
    // var startVal = this.props.data.filters ? this.props.data.filters[0].value : '';
    // var endVal = this.props.data.filters ? this.props.data.filters[0].value : '';
    return (
      <div>
        <input id="year_s" name="year_s" value='' type="text" onChange={ this.handleChange }/>
        <input id="year_e" name="year_e" value='' type="text" onChange={ this.handleChange }/>
      </div>
    ) 
  }
}

class FacetFieldset extends React.Component {
  checkFacet(facet) {
    var checked = false;
    for (let filter of this.props.query.filters) {
      if (facet.value === filter.value) {
        checked = true;
      }
    }
    return checked;
  }

  render() {
    var facetItemNodes;
    if (this.props.data.facets) {
      facetItemNodes = this.props.data.facets.map( facet => {
        var facetItemData = {
          facetType: this.props.data.fieldName,
          facet: facet,
          checked: this.props.query && this.props.query.filters ? this.checkFacet(facet) : false
        }
        return ( <FacetItem key={facet.value} data={facetItemData} /> )
      });
    } else {
      //pub_year
      facetItemNodes = (
        <PubYear data={this.props.data} query={this.props.query} />
      )
    }
    
    return (
      <details className="c-facetbox" id={this.props.data.fieldName}>
        <summary className="c-facetbox__summary">{this.props.data.display}</summary>
        <div className="facetItems c-checkbox">
          {facetItemNodes}
        </div>
      </details>
    )
  }
}

class CurrentSearchTerms extends React.Component {
  render() {
    var searchString = 'Your search: "' + this.props.query.q + '"';
    var filters;
    
    if (!($.isEmptyObject(this.props.query['filters']))) {
      var filterTypes = ['type_of_work', 'peer_reviewed', 'supp_file_types', 'campuses', 'departments', 'journals', 'disciplines', 'rights'];
      var activeFilters = [];
      for (let filterType of filterTypes) {
        if (this.props.query['filters'][filterType] && this.props.query['filters'][filterType]['filters'].length > 0) {
          var displayNames = this.props.query['filters'][filterType]['filters'].map(function(filter) {
            return filter['displayName'];
          });
          activeFilters.push({'filterType': this.props.query['filters'][filterType]['display'], 'filters': displayNames.join(" ")});
        }
      }

      filters = (
        <div>
    			<div className="c-filter__active-header">
    				<span id="c-filter__active-title">Active filters:</span>
    				<button>clear all</button>
          </div>
    			<div role="group" aria-labelledby="c-filter__active-title" className="c-filter__active">
            { activeFilters.map(function(filter) {
              return (
                <button key={filter.filterType}>{filter.filterType} ({filter.filters})</button>
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

class FacetForm extends React.Component {  
  render() {
    var facetForm = this.props.data.facets.map(function(query, handler) {
      return function(fieldset) {
        var fieldName = fieldset.fieldName;
        var filters = query.filters && query.filters[fieldName] ? query.filters[fieldName] : [];
        return (
          <FacetFieldset key={fieldName} data={fieldset} query={filters} />
        )
      }
    }(this.props.query, this.handleChange));

    return (
			<Form id="facetForm" to='/search' method="GET">
        <CurrentSearchTerms query={this.props.query} count={this.props.data.count}/>
        {facetForm}
				<button type="submit" id="facet-form-submit">Search</button>
      </Form>
    )
  }
}

class ResultItem extends React.Component {
  render() {
    var tagList = []
    if (this.props.result.genre === 'article') {
      tagList.push({display: 'Article', tagStyle: 'article'});
    }
    if (this.props.result.peerReviewed) {
      tagList.push({display: 'Peer Reviewed', tagStyle: 'peer'});
    }
    
    return (
			<section className="c-scholworks__item">
				<div className="c-scholworks__main-column">
          <ul className="c-scholworks__tag-list">
            { tagList.map(function(tag) { 
              return (
                <li key={tag.tagStyle} className={ "c-scholworks__tag-" + tag.tagStyle }>{tag.display}</li>
              ) 
            }) }
          </ul>
          <header>
            <a href="{this.props.result.id}">{this.props.result.title}</a>
          </header>
          <p>
            Authors: ???<br/>
            <a className="c-scholworks__institution-link" href="">Journal Info: ???</a> ({this.props.result.pub_date})
          </p>
          <p>
            {this.props.result.abstract}
          </p>

          <ol>
            <li>Genre: {this.props.result.genre}</li>
            <li>Peer Reviewed: {this.props.result.peerReviewed}</li>
            <li>CC License: {this.props.result.rights}</li>
            <li>Thumbnail: ???</li>
            <li>Journal Info: ???</li>
            <li>Supplemental items: ???</li>
          </ol>
        </div>
      </section>
    )
  }
}

class ScholarlyWorks extends React.Component {
  render() {
    var resultNodes = this.props.results.map(function(result) {
      return (
        <ResultItem key={result.id} result={result} />
      );
    });

    return (
      <div className="c-scholworks">
        {resultNodes}
      </div>
    )
  }
}

class SearchPage extends PageBase {
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL(props) {
    return "/api/search/" + props.location.search  // plus whatever props.params.YourUrlParam, etc.
  }

  renderData(data) {
    var facetFormData = {facets: data.facets, count: data.count};
    return(
      <div className="l_search">
        <HeaderComp />
        <NavComp />
        <div className="c-columns">
          <aside>
            <FacetForm data={facetFormData} query={data.query} />
          </aside>
          <main>
				  	<div className="l-search__sort-pagination">
				  	</div>
				  	<section className="o-columnbox-main">
							<header>
								<h2 className="o-columnbox-main__heading">Informational Pages (12 results)</h2>
							</header>
            </section>
						<section className="o-columnbox-main">
							<header>
								<h2 className="o-columnbox-main__heading">Scholarly Works (12,023 results)</h2>
							</header>
              <ScholarlyWorks results={data.searchResults} />
            </section>
          </main>
        </div>
      </div>
  )}
}

module.exports = SearchPage;
