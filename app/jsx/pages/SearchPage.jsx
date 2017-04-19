
import React from 'react'
import $ from 'jquery'
import _ from 'lodash'   // mainly for _.isEmtpy() which also works server-side (unlike $.isEmptyObject)
import { Link } from 'react-router'
import Form from 'react-router-form'

import PageBase from './PageBase.jsx'
import Subheader1Comp from '../components/Subheader1Comp.jsx'
import ScholWorksComp from '../components/ScholWorksComp.jsx'
import FilterComp from '../components/FilterComp.jsx'
import ExportComp from '../components/ExportComp.jsx'
import SortPaginationComp from '../components/SortPaginationComp.jsx'
import InfoPagesComp from '../components/InfoPagesComp.jsx'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}


// FacetItem  
// props = {
//   data: { facetType: 'departments',
//     ancestorChecked: true|false                     //Optional, only specified if facet has ancestors (departments)
//     facet: { value: 'uclalaw',
//       displayName: 'UCLA School of Law',            //Optional, if no displayName specified, uses facet.value for display
//       count: 331,
//       descendents: [                                //Optional, only specified if facet has children (departments)
//         {
//           ancestor_in_list: true,
//           count: 9,
//           displayName: 'The Williams Institute',
//           value: 'uclalaw_williams'
//         }
//       ]
//       ancestor_in_list: true|false,                 // Optional, only specified if facet has ancestors (departments),
//                                                     // and the ancestor is also in the facet list
//                                                     // Though it doesn't currently make sense for ancestor_in_list to be false,
//                                                     // the frontend doesn't assume that to be the case.
//     }
//   }
//   //Handler is FacetFieldset's handleChange function
//   handler: FacetFieldset.handleChange(event, filter=[], filter_cleanup=[])
//   //Query is an array of applied filters for the current fieldset (departments, in this case) ONLY
//   //child filters are not listed, since these are assumed under the parent 'uclalaw' and not included in the AWS query
//   //query is not defined if no filters are applied for the current fieldset
//   query: [{displayName: 'UCLA School of Law (All)', value: 'uclalaw'}]
// }
class FacetItem extends React.Component {
  
  //if the facet item is in the query list, or the facet item's ancestor is checked, 
  //return true - this facet item should be checked
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
  
  // this is what actually submits the form when a checkbox has been checked
  componentDidUpdate(prevProps, prevState) {
    if(this.checkFacet(this.props) !== this.checkFacet(prevProps) && !this.props.data.ancestorChecked && !prevProps.data.ancestorChecked) {
      $('[name=start]').val('0');
      $('#facet-form-submit').click();
    }
  }

  handleChange = event => {  // compact syntax that takes care of binding the event handler
    var filter;
    var filter_cleanup = [];
    // Rights label includes an icon and descriptive text, but value is just the code: 'CC-BY'
    // the Active Filters panel at the top of the lefthand sidebar displays just the codes
    if (this.props.data.facetType == 'rights' && this.props.data.facet.value != 'public') {
      filter = [{displayName: this.props.data.facet.value, value: this.props.data.facet.value}];
    }
    // Selected departments automatically include 'All' child departments (if there are any)
    // append '(All)' to the display name for viewing in the Active Filters panel at the top of the lefthand sidebar
    else if (this.props.data.facetType == 'departments' && 'descendents' in this.props.data.facet) {
      filter = [{displayName: this.label + " (All)", value: this.props.data.facet.value}];

      // Add each descendent to the filter_cleanup array, for use in FacetFieldset's handleChange function
      // this removes any previously applied children from the array at this.props.query
      for (let d of this.props.data.facet.descendents) {
        filter_cleanup.push({displayName: d.displayName, value: d.value});
      }
    }
    // Default case for all other facet types (not rights or departments)
    // this filter will get added to the array at this.props.query by FacetFieldset's handleChange function
    else {
      filter = [{displayName: this.label, value: this.props.data.facet.value}];
    }
    //FacetFieldset's handleChange function
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
          ancestorChecked: this.checkFacet(this.props)
        }
        return (<FacetItem key={d.value} data={descendentItemData} query={this.props.query} handler={this.props.handler}/>)
      })
    }

    return (
      <div className="facetItem">
        <input id={facet.value} className="c-checkbox__input" type="checkbox"
          name={this.props.data.facetType} value={facet.value}
          onChange={this.handleChange}
          checked={this.checkFacet(this.props)} disabled={this.props.data.ancestorChecked ? true : false}/>
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
    if (_.isEmpty(nextProps.query) && (this.state.pub_year_start !== '' || this.state.pub_year_end !== '')) {
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

// FacetFieldset basically differentiates between Publication Year, and all the other 'normal' facets
// FacetFieldset props: 
// props = {
//   data: { fieldName: 'departments',
//     display: 'Departments'
//     facets: [
//       { value: 'uclalaw',
//         displayName: 'UCLA School of Law',            //Optional, if no displayName specified, uses facet.value for display
//         count: 331,
//         descendents: [                                //Optional, only specified if facet has children (departments)
//           {
//             ancestor_in_list: true,                   //Descendents aren't included in the facets array, only in
//             count: 9,                                 //their parent's descendents arrays
//             displayName: 'The Williams Institute',
//             value: 'uclalaw_williams'
//           }
//         ]
//       },
//       { value: 'bling',
//         displayName: 'Department of Linguistics',
//         count: 269
//       }, ...
//     ]
//   }
//   //Handler is FacetForm's changeFacet function
//   handler: FacetForm.changeFacet(event, fieldsetQuery={}, fieldType='')
//   //Query specifies the fieldName and displayName for this facetFieldset, as well as an array of
//   //applied filters for this field ONLY (the array gets passed on to FacetItem children)
//   //query is an empty object if no filters are applied for the current fieldset
//   query: { display: 'Departments',
//     fieldName: 'departments',
//     filters: [
//       {
//         displayName: 'UCLA School of Law (All)',
//         value: 'uclalaw'
//       }
//     ]
//   }
// }
class FacetFieldset extends React.Component {
  handleChange = this.handleChange.bind(this);
  pubDateChange = this.pubDateChange.bind(this);

  //Called by a FacetItem's handleChange function
  //event is the browser event, filter is an array of filters to be applied
  //and filter_cleanup is an array of filters to be removed as an implication of the filters to be applied
  //(as is the case when a child facet is already selected, but then it's parent facet is selected)
  handleChange(event, filter, filter_cleanup) {
    var newQuery;
    //event.target.checked means we're in the business of adding filters
    if (event.target.checked) {
      if (!_.isEmpty(this.props.query)) {
        //there's already filters of this type, so add filters
        newQuery = $.extend(true, {}, this.props.query); // true=deep copy
        //remove filters specified in filter_cleanup array
        //(this is any child facets that were selected at the time when the parent facet is selected)
        if (filter_cleanup.length > 0) {
          for (var f in filter_cleanup) {
            var i = newQuery.filters.findIndex(j => { return j.value == filter_cleanup[f].value });
            if (i >= 0) // only remove if found
              newQuery.filters.splice(i, 1);
          }
        }
        //concatenate the new filter to the current list of filters
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
      //!event.target.checked means we're in the business of removing filters
      if (this.props.query.filters.length > 1) {
        newQuery = $.extend(true, {}, this.props.query); // true=deep copy
        for (var f in filter) {
          var i = newQuery.filters.findIndex(j => { return j.value == filter[f].value });
          newQuery.filters.splice(i, 1);
        }
      }
    }
    //call FacetForm's changeFacet function - event, fieldsetQuery, fieldType
    this.props.handler(event, newQuery, event.target.name);
  }

  pubDateChange(event, filter) {
    var newQuery;
    if (filter.value !== "") {
      if (!_.isEmpty(this.props.query)) {
        newQuery = $.extend(true, {}, this.props.query); // true=deep copy
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

// FacetForm manages the state for FacetItems and FilterComp 
// all interactions with faceting search parameters get propagated up to FacetForm
// and then down to their respective components before issuing the search query
// to update the scholarly works list
// FacetForm props:
// props = {
//   data: {
//     count: 331
//     facets: [
//       {display: 'Type of Work', fieldName: 'type_of_work', facets: []}
//     ]
//   }
//   query: {
//     q: 'chinese',
//     rows: '10',
//     sort: 'rel',
//     start: '0',
//     filters: {
//       departments: {
//         display: 'Department',
//         fieldName: 'departments',
//         filters: [
//           {displayName: 'UCLA School of Law', value: 'uclalaw'}
//         ]
//       }
//     }
//   }
// }
class FacetForm extends React.Component {
  state = {
    query: this.props.query
  }
  changeFacet = this.changeFacet.bind(this);
  removeFilters = this.removeFilters.bind(this);
  handleSubmit = this.handleSubmit.bind(this);
  
  // Called by FacetFieldset's handleChange function
  changeFacet(event, fieldsetQuery, fieldType) {
    var newQuery = $.extend(true, {}, this.state.query); // true=deep copy

    if (fieldsetQuery) {
      newQuery.filters[fieldType] = fieldsetQuery;
    } else {
      delete newQuery.filters[fieldType];
    }

    this.setState({query: newQuery});
  }

  // Set as the onClick handler for FilterComp's active filter buttons
  removeFilters(event) {
    var newQuery = $.extend(true, {}, this.state.query); // true=deep copy
    var fieldType = $(event.target).data('filter-type');
    delete newQuery.filters[fieldType];
    this.setState({query: newQuery});
  }

  // Set as the Form's onSubmit handler
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
        <FilterComp query={this.state.query} count={this.props.data.count} handler={this.removeFilters}/>
        {facetForm}
        <button type="submit" id="facet-form-submit">Search</button>
      </Form>
    )
  }
}

class SearchPage extends PageBase {
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    return "/api/search/" + this.props.location.search  // plus whatever props.params.YourUrlParam, etc.
  }

  renderData(data) {
    var facetFormData = {facets: data.facets, count: data.count};
    return(
      <div className="l_search">
        <Subheader1Comp navdata={[{name: 'Campus Sites', slug: ''}, {name: 'UC Open Access Policies', slug: ''}, {name: 'eScholarship Publishing', slug: ''}]} />
        <ExportComp />
        <div className="c-columns">
          <aside>
            <FacetForm data={facetFormData} query={data.query} />
          </aside>
          <main id="maincontent">
            <SortPaginationComp query={data.query} count={data.count}/>
            <section className="o-columnbox1">
              <header>
                <h2 className="o-columnbox1__heading">Informational Pages (12 results)</h2>
              </header>
              <InfoPagesComp />
            </section>
            <section className="o-columnbox1">
              <header>
                <h2 className="o-columnbox1__heading">Scholarly Works ({data.count} results)</h2>
              </header>
              <div>
                { data.searchResults.map(result =>
                  <ScholWorksComp key={result.id} result={result} />)
                }
              </div>
            </section>
          </main>
        </div>
      </div>
  )}
}

export { FacetItem, PubYear, FacetFieldset, FacetForm, SearchPage }
