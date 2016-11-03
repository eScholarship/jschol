
import React from 'react'
import $ from 'jquery'
import { Link } from 'react-router'
import Form from 'react-router-form'

import PageBase from './PageBase.jsx'
import { HeaderComp, NavComp } from '../components/AllComponents.jsx'

class FacetItem extends React.Component {
  state = {
    checked: this.checkFacet(this.props),
    disabled: this.props.data.ancestorChecked ? true : false
  }
  handleChange = this.handleChange.bind(this);
  
  componentWillReceiveProps(nextProps) {
    // if the item is a 'child' facet
    if ('ancestor_in_list' in this.props.data.facet) {
      if (nextProps.data.ancestorChecked !== this.props.data.ancestorChecked) {
        if (nextProps.data.ancestorChecked) {
          this.setState({checked: true, disabled: true});
        } else {
          this.setState({checked: false, disabled: false});
        }
      }
    }

    if (this.checkFacet(nextProps) !== this.state.checked) {
      this.setState({checked: this.checkFacet(nextProps)});
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.checked !== prevState.checked && !this.state.disabled && !prevState.disabled) {
      $('[name=start]').val('0');
      $('#facet-form-submit').click();
    }
  }

  checkFacet(props) {
    if (props.query) {
      for (let filter of props.query) {
        if (props.data.facet.value == filter.value) {
          return true;
        }
      }
      if (props.data.ancestorChecked) {
        return true;
      }
    }
    return false;
  }

  handleChange(event) {
    this.setState({checked: event.target.checked});
    var filter;
    var filter_cleanup = [];
    // Rights label includes icon and descriptive text, but value is just the code: 'CC-BY'
    if (this.props.data.facetType == 'rights' && this.props.data.facet.value != 'public') {
      filter = [{displayName: this.props.data.facet.value, value: this.props.data.facet.value}];
    }
    // Selected departments automatically include 'All' child departments (if there are any)
    else if (this.props.data.facetType == 'departments' && 'descendents' in this.props.data.facet) {
      filter = [{displayName: this.label + " (All)", value: this.props.data.facet.value}];

      for (let d of this.props.data.facet.descendents) {
        filter_cleanup.push({displayName: d.displayName, value: d.value});
      }
    }
    else {
      filter = [{displayName: this.label, value: this.props.data.facet.value}];
    }
    this.props.handler(event, filter, filter_cleanup);
  }

  render() {
    var facet = this.props.data.facet;
    this.label = facet.displayName ? facet.displayName : facet.value;

    var descendents;
    if (facet.descendents) {
      descendents = facet.descendents.map( d => {
        var descendentItemData = {
          facetType: this.props.data.facetType,
          facet: d,
          ancestorChecked: this.state.checked
        }
        return (<FacetItem key={d.value} data={descendentItemData} query={this.props.query} handler={this.props.handler}/>)
      })
    }

    return (
      <div className="facetItem">
        <input id={facet.value} className="c-checkbox__input" type="checkbox"
          name={this.props.data.facetType} value={facet.value}
          onChange={this.handleChange}
          checked={this.state.checked} disabled={this.state.disabled}/>
        <label htmlFor={facet.value} className="c-checkbox__label">{this.label} ({facet.count})</label>
        <div style={{paddingLeft: '30px'}}>{descendents}</div>
      </div>
    )
  }
}

class PubYear extends React.Component {
  state = {
    pub_year_start: this.props.data.range.pub_year_start ? this.props.data.range.pub_year_start : '',
    pub_year_end: this.props.data.range.pub_year_end ? this.props.data.range.pub_year_end : ''
  }
  handleChange = this.handleChange.bind(this);
  onBlur = this.onBlur.bind(this);

  componentWillReceiveProps(nextProps) {
    if ($.isEmptyObject(nextProps.query) && (this.state.pub_year_start !== '' || this.state.pub_year_end !== '')) {
      this.setState({
        pub_year_start: '',
        pub_year_end: ''
      }, this.submitForm);
    }
  }

  onBlur(event) {
    var displayYears;
    if (this.state.pub_year_start || this.state.pub_year_end) {
      displayYears = this.state.pub_year_start + "-" + this.state.pub_year_end;
    }
    else {
      displayYears = "";
    }

    this.submitForm();
    this.props.handler(event, {value: displayYears});
  }

  submitForm() {
    $('[name=start]').val('0');
    $('#facet-form-submit').click();
  }

  handleChange(event) {
    if (event.target.id == 'pub_year_start') {
      this.setState({pub_year_start: event.target.value});
    } else if (event.target.id = 'pub_year_end') {
      this.setState({pub_year_end: event.target.value});
    }
  }

  render() {
    return (
      <div>
        <label htmlFor="pub_year_start">From: </label>
        <input id="pub_year_start" name="pub_year_start" type="text"
          value={this.state.pub_year_start}
          onChange={ this.handleChange } onBlur={ this.onBlur }/>
        <br/>
        <label htmlFor="pub_year_end">To: </label>
        <input id="pub_year_end" name="pub_year_end" type="text"
          value={this.state.pub_year_end}
          onChange={ this.handleChange } onBlur={ this.onBlur }/>
      </div>
    ) 
  }
}

class FacetFieldset extends React.Component {
  handleChange = this.handleChange.bind(this);
  pubDateChange = this.pubDateChange.bind(this);

  handleChange(event, filter, filter_cleanup) {
    var newQuery;
    if (event.target.checked) {
      //add filters
      if (!$.isEmptyObject(this.props.query)) {
        //there's already filters of this type, so add filters
        newQuery = $.extend({}, this.props.query);
        //remove filters specified in filter_cleanup array
        //(as in children of deparments when the parent department has been selected)
        if (filter_cleanup.length > 0) {
          for (var f in filter_cleanup) {
            var i = newQuery.filters.findIndex(j => { return j.value == filter_cleanup[f].value });
            newQuery.filters.splice(i, 1);
          }
        }
        newQuery.filters = newQuery.filters.concat(filter);
      } else {
        //there's no filters of this type, so create a filter
        newQuery = {
          display: this.props.data.display,
          fieldName: this.props.data.fieldName,
          filters: filter
        }
      }
    } else {
      //remove filters
      if (this.props.query.filters.length > 1) {
        newQuery = $.extend({}, this.props.query);
        for (var f in filter) {
          var i = newQuery.filters.findIndex(j => { return j.value == filter[f].value });
          newQuery.filters.splice(i, 1);
        }
      }
    }
    this.props.handler(event, newQuery, event.target.name);
  }

  pubDateChange(event, filter) {
    var newQuery;
    if (filter.value !== "") {
      if (!$.isEmptyObject(this.props.query)) {
        newQuery = $.extend({}, this.props.query);
        newQuery.filters = [filter]
      } else {
        newQuery = {
          display: this.props.data.display,
          fieldName: this.props.data.fieldName,
          filters: [filter]
        }
      }
    }
    this.props.handler(event, newQuery, 'pub_year');
  }

  render() {
    var facetItemNodes;
    if (this.props.data.facets) {
      facetItemNodes = this.props.data.facets.map( facet => {
        var facetItemData = {
          facetType: this.props.data.fieldName,
          facet: facet,
        }
        return ( <FacetItem key={facet.value} data={facetItemData} query={this.props.query.filters} handler={this.handleChange} /> )
      });
    } else {
      //pub_year
      facetItemNodes = (
        <PubYear data={this.props.data} query={this.props.query} handler={this.pubDateChange} />
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
  clearAll(event) {
    $('[name=start]').val('0');
    var filters = $(':checked').prop('checked', false);
  }

  render() {
    var searchString = 'Your search: "' + this.props.query.q + '"';
    var filters;
    
    if (!($.isEmptyObject(this.props.query['filters']))) {
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

class FacetForm extends React.Component {
  state = {
    query: this.props.query
  }
  changeFacet = this.changeFacet.bind(this);
  removeFilters = this.removeFilters.bind(this);
  handleSubmit = this.handleSubmit.bind(this);

  changeFacet(event, fieldsetQuery, fieldType) {
    //make a copy of query state, so as not to mutate this.state
    var newQuery = $.extend({}, this.state.query);

    if (fieldsetQuery) {
      newQuery.filters[fieldType] = fieldsetQuery;
    } else {
      delete newQuery.filters[fieldType];
    }

    this.setState({query: newQuery});
  }

  removeFilters(event) {
    var newQuery = $.extend({}, this.state.query);
    var fieldType = $(event.target).data('filter-type');
    delete newQuery.filters[fieldType];
    this.setState({query: newQuery});
  }

  handleSubmit(event, formData) {
    for(var key in formData) {
      if (formData[key] == "" ||
      (key === 'sort' && formData[key] === 'rel') ||
      (key === 'rows' && formData[key] === '10') ||
      (key === 'start' && formData[key] === '0')) {
        delete formData[key];
      }
    }
    // Handy for debugging
    // console.log(this.state.query);
    // console.log(JSON.stringify(formData));
    return true;
  }

  // form submission happens after all components have updated
  // ran into issues with FacetItem's componentWillReceiveProps
  // not getting called until AFTER form submission, but the
  // componentWillReceiveProps function handles disabling checkboxes
  // componentDidUpdate(prevProps, prevState) {
  // }

  render() {
    var facetForm = this.props.data.facets.map(fieldset => {
      var fieldName = fieldset.fieldName;
      var filters = this.state.query.filters && this.state.query.filters[fieldName] ? this.state.query.filters[fieldName] : {};
      return (
        <FacetFieldset key={fieldName} data={fieldset} query={filters} handler={this.changeFacet} />
      )
    });

    return (
			<Form id="facetForm" to='/search' method="GET" onSubmit={this.handleSubmit}>
        <CurrentSearchTerms query={this.state.query} count={this.props.data.count} handler={this.removeFilters}/>
        {facetForm}
				<button type="submit" id="facet-form-submit">Search</button>
      </Form>
    )
  }
}

class SortComp extends React.Component {
  state = {
    rows: this.props.query.rows ? this.props.query.rows : "10",
    sort: this.props.query.sort ? this.props.query.sort : "rel"
  }
  handleChange = this.handleChange.bind(this);

  handleChange(event) {
    if (event.target.name == "rows") {
      this.setState({rows: event.target.value});
    }
    if (event.target.name == "sort") {
      this.setState({sort: event.target.value});
    }
    $('[name=start]').val('0');
    $('#facet-form-submit').click();
  }

  render() {
    return (
      <div className="c-sort">
        <div className="o-input__droplist">
          <label htmlFor="c-sort1">Sort By:</label>
          <select name="sort" id="c-sort1" form="facetForm" value={ this.state.sort } onChange={ this.handleChange }>
            <option value="rel">Relevance</option>
            <option value="pop">Most Popular</option>
            <option value="a-title">A-Z By Title</option>
            <option value="z-title">Z-A By Title</option>
            <option value="a-author">A-Z By Author</option>
            <option value="z-author">Z-A By Author</option>
            <option value="asc">Date Ascending</option>
            <option value="dsc">Date Decending</option>
          </select>
        </div>
        <div className="o-input__droplist c-sort__page-input">
          <label htmlFor="c-sort2">Show:</label>
          <select name="rows" id="c-sort2" form="facetForm" value={ this.state.rows } onChange={ this.handleChange }>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    )
  }
}

class PaginationComp extends React.Component {
  next = this.next.bind(this);
  previous = this.previous.bind(this);
  first = this.first.bind(this);
  last = this.last.bind(this);
  page = this.page.bind(this);

  next(event) {
    if (parseInt(this.props.query.start) + parseInt(this.props.query.rows) <= this.props.count) {
      var newStart = parseInt(this.props.query.start) + parseInt(this.props.query.rows);
      $('[form=facetForm][name=start]').val(newStart);
      $('#facet-form-submit').click();
    }
  }

  previous(event) {
    if (parseInt(this.props.query.start) >= parseInt(this.props.query.rows)) {
      var newStart = parseInt(this.props.query.start) - parseInt(this.props.query.rows);
      $('[form=facetForm][name=start]').val(newStart);
      $('#facet-form-submit').click();
    }
  }

  first(event) {
    $('[form=facetForm][name=start]').val(0);
    $('#facet-form-submit').click();
  }

  last(event) {
    var newStart = Math.floor(this.props.count / this.props.query.rows);
    newStart = newStart * this.props.query.rows;
    $('[form=facetForm][name=start]').val(newStart);
    $('#facet-form-submit').click();
  }

  page(event) {
    var newStart = (event.target.text - 1) * this.props.query.rows;
    $('[form=facetForm][name=start]').val(newStart);
    $('#facet-form-submit').click();
  }

  render() {
    var page = Math.ceil(this.props.query.start / this.props.query.rows) + 1;
    var pages = Math.ceil(this.props.count / this.props.query.rows);
    var displayedPages = []

    if (pages <= 7) {
      for (var i=1; i<=pages; i++) {
        displayedPages.push({num: i, className: i == page ? "c-pagination__item--active" : "c-pagination__item"});
      }
      return (
      <div className="c-pagination">
        <a className="c-pagination__prevnext" onClick={this.previous}>Previous</a>
        { displayedPages.map(page => {
          return (<a key={page.num} className={page.className} onClick={this.page}>{page.num}</a>)
        }) }
        <a className="c-pagination__prevnext" onClick={this.next}>Next</a>
      </div>
      )
    }

    if (page <= 4) {
      for (var i=1; i<=5; i++) {
        displayedPages.push({num: i, className: i == page ? "c-pagination__item--active" : "c-pagination__item"});
      }
      return (
        <div className="c-pagination">
          <a className="c-pagination__prevnext" onClick={this.previous}>Previous</a>
          { displayedPages.map(page => {
            return (<a key={page.num} className={page.className} onClick={this.page}>{page.num}</a>)
          }) }
          <span className="c-pagination__ellipses">&hellip;</span>
          <a className="c-pagination__item" onClick={this.last}>{pages}</a>
          <a className="c-pagination__prevnext" onClick={this.next}>Next</a>
        </div>
      )
    }
    else if (page > pages-4) {
      for (var i=pages-4; i<=pages; i++) {
        displayedPages.push({num: i, className: i == page ? "c-pagination__item--active" : "c-pagination__item"});
      }
      return (
        <div className="c-pagination">
          <a className="c-pagination__prevnext" onClick={this.previous}>Previous</a>
          <a className="c-pagination__item" onClick={this.first}>1</a>
          <span className="c-pagination__ellipses">&hellip;</span>
          { displayedPages.map(page => {
            return (<a key={page.num} className={page.className} onClick={this.page}>{page.num}</a>)
          }) }
          <a className="c-pagination__prevnext" onClick={this.next}>Next</a>
        </div>
      )
    }
    else {
      return (
        <div className="c-pagination">
          <a className="c-pagination__prevnext" onClick={this.previous}>Previous</a>
          <a className="c-pagination__item" onClick={this.first}>1</a>
          <span className="c-pagination__ellipses">&hellip;</span>
          <a className="c-pagination__item" onClick={this.prev}>{page - 1}</a>
          <a className="c-pagination__item c-pagination__item--active">{page}</a>
          <a className="c-pagination__item" onClick={this.next}>{page + 1}</a>
          <span className="c-pagination__ellipses">&hellip;</span>
          <a className="c-pagination__item" onClick={this.last}>{pages}</a>
          <a className="c-pagination__prevnext" onClick={this.next}>Next</a>
        </div>
      )
    }
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
            <a href={this.props.result.id}>{this.props.result.title}</a>
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
            <section className="o-columnbox-main">
              <header>
                <h2 className="o-columnbox-main__heading">Informational Pages (12 results)</h2>
              </header>
            </section>
            <section className="o-columnbox-main">
              <header>
                <h2 className="o-columnbox-main__heading">Scholarly Works ({data.count} results)</h2>
              </header>
              <div className="l-search__sort-pagination">
                <SortComp query={data.query} />
                <input type="hidden" name="start" form="facetForm" value={data.query.start} />
                <PaginationComp query={data.query} count={data.count}/>
              </div>
              <ScholarlyWorks results={data.searchResults} />
              <PaginationComp query={data.query} count={data.count}/>
            </section>
          </main>
        </div>
      </div>
  )}
}

module.exports = SearchPage;
