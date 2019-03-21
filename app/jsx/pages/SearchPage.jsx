import React from 'react'
import PropTypes from 'prop-types'
import $ from 'jquery'
import _ from 'lodash'
import { Link } from 'react-router-dom'
import getFormData from 'get-form-data'

import PageBase from './PageBase.jsx'
import Header2Comp from '../components/Header2Comp.jsx'
import NavComp from '../components/NavComp.jsx'
import ScholWorksComp from '../components/ScholWorksComp.jsx'
import FilterComp from '../components/FilterComp.jsx'
import ExportComp from '../components/ExportComp.jsx'
import SortPaginationComp from '../components/SortPaginationComp.jsx'
import InfoPagesComp from '../components/InfoPagesComp.jsx'
import PaginationComp from '../components/PaginationComp.jsx'
import Breakpoints from '../../js/breakpoints.json'
import ModalComp from '../components/ModalComp.jsx'
import MetaTagsComp from '../components/MetaTagsComp.jsx'
import FormComp from '../components/FormComp.jsx'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

let MAX_SET_SIZE = 6

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
          return true
        }
      }
      if (props.data.ancestorChecked) {
        return true
      }
    }
    return false
  }

  // this is what actually submits the form when a checkbox has been checked
  componentDidUpdate(prevProps, prevState) {
    if(this.checkFacet(this.props) !== this.checkFacet(prevProps) && !this.props.data.ancestorChecked && !prevProps.data.ancestorChecked) {
      $('[name=start]').val('0')
      $('#facet-form-submit').click()
    }
  }

  handleChange = event => {  // compact syntax that takes care of binding the event handler
    let filter
    let filter_cleanup = []
    // Rights label includes an icon and descriptive text, but value is just the code: 'CC-BY'
    // the Active Filters panel at the top of the lefthand sidebar displays just the codes
    if (this.props.data.facetType == 'rights' && this.props.data.facet.value != 'public') {
      filter = [{displayName: this.props.data.facet.value, value: this.props.data.facet.value}]
    }
    // Selected departments automatically include 'All' child departments (if there are any)
    // append '(All)' to the display name for viewing in the Active Filters panel at the top of the lefthand sidebar
    else if (this.props.data.facetType == 'departments' && 'descendents' in this.props.data.facet) {
      filter = [{displayName: this.label + " (All)", value: this.props.data.facet.value}]

      // Add each descendent to the filter_cleanup array, for use in FacetFieldset's handleChange function
      // this removes any previously applied children from the array at this.props.query
      for (let d of this.props.data.facet.descendents) {
        filter_cleanup.push({displayName: d.displayName, value: d.value})
      }
    }
    // Default case for all other facet types (not rights or departments)
    // this filter will get added to the array at this.props.query by FacetFieldset's handleChange function
    else {
      filter = [{displayName: this.label, value: this.props.data.facet.value}]
    }
    //FacetFieldset's handleChange function
    this.props.handler(event, filter, filter_cleanup)
  }

  render() {
    let facet = this.props.data.facet
    let facetValueKey = facet.value.replace(/ /g, '_')
    this.label = facet.displayName ? facet.displayName : facet.value
    // Put a special class name on the rights facet to show Creative Commons icons
    let className = this.props.data.facetType == "rights"
                      ? `c-checkbox__attrib-${facet.value.toLowerCase()}`.replace(/ /g, '-')
                      : ""
    return (
      <li className={className}>
        <input id={`${this.props.data.facetType}-${facetValueKey}`} className="c-checkbox__input" type="checkbox"
          name={this.props.data.facetType} value={facet.value}
          onChange={this.handleChange}
          checked={this.checkFacet(this.props)} disabled={this.props.data.ancestorChecked ? true : false}/>
        <label htmlFor={`${this.props.data.facetType}-${facetValueKey}`} className="c-checkbox__label">{this.label} ({facet.count})</label>
        { facet.descendents &&
          <ul className="c-checkbox">
            { facet.descendents.map(d => {
                let descendentItemData = {
                  facetType: this.props.data.facetType,
                  facet: d,
                  ancestorChecked: this.checkFacet(this.props)
                }
                return (<FacetItem key={d.value} data={descendentItemData} query={this.props.query} handler={this.props.handler}/>)
              })
            }
          </ul>
        }
      </li>
    )
  }
}

class PubYear extends React.Component {
  constructor(props) {
    super(props)
    this.state = this.setupState(props)
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.query, nextProps.query))
      this.setState(this.setupState(nextProps))
  }

  setupState(props) {
    return {
      pub_year_start: props.data.range && props.data.range.pub_year_start ? props.data.range.pub_year_start : '',
      pub_year_end: props.data.range && props.data.range.pub_year_end ? props.data.range.pub_year_end : ''
    }
  }

  startYear() {
    return this.props.data.range && this.props.data.range.pub_year_start ? this.props.data.range.pub_year_start : ''
  }

  endYear() {
    return this.props.data.range && this.props.data.range.pub_year_end ? this.props.data.range.pub_year_end : ''
  }

  handleSubmit = event =>{
    let displayYears
    if (this.pub_year_start.value || this.pub_year_end.value) {
      displayYears = this.pub_year_start.value + "-" + this.pub_year_end.value
    }
    else {
      displayYears = ""
    }

    this.submitForm()
    this.props.handler(event, {value: displayYears})
  }

  submitForm() {
    $('[name=start]').val('0')
    $('#facet-form-submit').click()
  }

  handleKeyPress = e => {
    // suppress Enter key - it goes to the wrong submit button
    if ((e.keyCode || e.which || e.charCode) == 13) {
      e.stopPropagation()
      e.preventDefault()
      return false
    }
    return true
  }

  render() {
    let year = (new Date()).getFullYear()
    return (
      <div className="c-pubyear">
        <div className="c-pubyear__field">
          <label htmlFor="c-pubyear__textfield1">From:</label>
          <input id="c-pubyear__textfield1" name="pub_year_start" type="text" maxLength="4" placeholder="1900"
            defaultValue={this.state.pub_year_start} ref={(input) => { this.pub_year_start = input }}
            onKeyPress={this.handleKeyPress} />
        </div>
        <div className="c-pubyear__field">
          <label htmlFor="c-pubyear__textfield2">To:</label>
          <input id="c-pubyear__textfield2" name="pub_year_end" type="text" maxLength="4" placeholder={year}
            defaultValue={this.state.pub_year_end} ref={(input) => { this.pub_year_end = input }}
            onKeyPress={this.handleKeyPress} />
        </div>
        <button className="c-pubyear__button" onClick={this.handleSubmit}>Apply</button>
      </div>
    ) 
  }
}

// A FacetFieldset is a single grouping of facet items.
// A facetFieldset with many facets is expandable: can be expanded into a modal to show all facet items
// Note: Differentiates between Publication Year, and all the other 'normal' facets
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
  state = { modalOpen: false }

  //Called by a FacetItem's handleChange function
  //event is the browser event, filter is an array of filters to be applied
  //and filter_cleanup is an array of filters to be removed as an implication of the filters to be applied
  //(as is the case when a child facet is already selected, but then it's parent facet is selected)
  handleChange = (event, filter, filter_cleanup) => {
    let newQuery
    //event.target.checked means we're in the business of adding filters
    if (event.target.checked) {
      if (!_.isEmpty(this.props.query)) {
        //there's already filters of this type, so add filters
        newQuery = $.extend(true, {}, this.props.query) // true=deep copy
        //remove filters specified in filter_cleanup array
        //(this is any child facets that were selected at the time when the parent facet is selected)
        if (filter_cleanup.length > 0) {
          for (let f in filter_cleanup) {
            let i = newQuery.filters.findIndex(j => { return j.value == filter_cleanup[f].value })
            if (i >= 0) // only remove if found
              newQuery.filters.splice(i, 1)
          }
        }
        //concatenate the new filter to the current list of filters
        newQuery.filters = newQuery.filters.concat(filter)
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
        newQuery = $.extend(true, {}, this.props.query) // true=deep copy
        for (let f in filter) {
          let i = newQuery.filters.findIndex(j => { return j.value == filter[f].value })
          newQuery.filters.splice(i, 1)
        }
      }
    }
    //call FacetForm's changeFacet function - event, fieldsetQuery, fieldType
    this.props.handler(event, newQuery, event.target.name)
  }

  pubDateChange = (event, filter) => {
    let newQuery
    if (filter.value !== "") {
      if (!_.isEmpty(this.props.query)) {
        newQuery = $.extend(true, {}, this.props.query) // true=deep copy
        newQuery.filters = [filter]
      } else {
        newQuery = {
          display: this.props.data.display,
          fieldName: this.props.data.fieldName,
          filters: [filter]
        }
      }
    }
    this.props.handler(event, newQuery, 'pub_year')
  }

  closeModal = (e, facetType) => {
    this.setState({modalOpen:false})
  }

  getFacetNodes = facets =>
    <ul className={this.props.data.fieldName == "supp_file_types" ? "c-checkbox--2column" : "c-checkbox"}>
      {facets.map( facet =>
        <FacetItem key={facet.value}
                   data={{facetType: this.props.data.fieldName, facet: facet}}
                   query={this.props.query.filters} handler={this.handleChange} /> )
      }
    </ul>

  getLength = ({ descendents }) => {
    let i = 0 
    if (descendents)
      return descendents.length + Math.max(...descendents.map(this.getLength))
    return 1 + i
  }

  /* Display prescribed maximum (rows of) facets.
     Optional filter for just returning facets included in provided hash
     Note: For any given facet: all of its descendents should be displayed,
           so slice will extend past maximum in some cases */
  facetsSliced = (facets, maxLength, checkHashFilter=false, checkedHash=null)  => {
    let i = 0, r = []
    for (let facet of facets){
      if (!checkHashFilter || (facet.value in checkedHash === false)) {
        r.push(facet)
        i += this.getLength(facet) 
        if (i >= maxLength) break
      }
    }
    return r
  }

  traverse = (facets, func) => {
    for (let i of facets){
      func.apply(this, [i])
      if (i.descendents) {
        this.traverse(i.descendents, func)
      }
    }
  }

  /* Gather all IDS of facets already in checkedHash (converts tree to flat hash) */
  checkedFacetsFromTree = (facets, checkedHash) =>{
    let hash = {}
    this.traverse(facets, function(node){
      if (node.value in checkedHash)
        hash[node.value] = true
    })
    return hash
  }

  /* Checked items will percolate to top */
  sliceArrangeFacets(facets)
  {
    if (!this.props.query.filters)
      return this.facetsSliced(facets, MAX_SET_SIZE)     /* Just return first set of 6 facets */

    /* Gather values of checked facets */
    let checkedHash = {}
    for (let filter of this.props.query.filters)
      checkedHash[filter.value] = true

    let checked = []
    /* Collect checked facets into variable 'checked' (recursive)
     * Can't use Generator function here since it's not supported by IE */
    let collectChecked = facets => {
      for (let facet of facets) {
        if (facet.value in checkedHash) {
          checked.unshift(facet)
        }
        if (facet.descendents)
          collectChecked(facet.descendents)
      }
    }
    collectChecked(facets)

    let remaining_count = MAX_SET_SIZE - Object.keys(checked).length

    /* Add unchecked facets to this sidebar facet set if there's room */
    if (remaining_count > 0) {
      let uncheckedParents = this.facetsSliced(facets, remaining_count, true, checkedHash)
      /* Retroactively remove any checked that may be children of this uncheckedParents */
      let checkedIds = this.checkedFacetsFromTree(uncheckedParents, checkedHash)
      if (checkedIds) {
        checked = checked.filter(facet => (facet.value in checkedIds === false))
      }
      return checked.concat(uncheckedParents)
    } else {
      return this.facetsSliced(checked, Math.max(MAX_SET_SIZE, Object.keys(checkedHash).length))
    }
  }

  render() {
    let data = this.props.data
    let facets, facetSidebarNodes, modal
    // Sidebar logic for facet placement/sorting
    if (data.facets) {
      let expandable = ["departments", "journals"].includes(data.fieldName)
      modal = expandable && (data.facets.length > MAX_SET_SIZE)
      if (this.state.modalOpen) {
        facets = []
      } else if (expandable) {
      /* Most facets come in alphabetized. For 'expandable' facets (like departments and journals)
         the modal (exposed from the 'Show more' link) should keep the alpha order, but in the 
         sidebar they should be sorted by count.    */
        facets = _.orderBy(data.facets, ['count'], ['desc'])
      /* But facets that are checked should have highest priority (visible in sidebar) */
        facets = (modal && data.facets.length > (MAX_SET_SIZE - 1)) ? this.sliceArrangeFacets(facets) : facets
      } else {
        facets = data.facets
      }
      facetSidebarNodes = this.getFacetNodes(facets)
    } else if (data.fieldName == "pub_year") {
      facetSidebarNodes = (
        <PubYear data={data} query={this.props.query} handler={this.pubDateChange} />
      )
    } else {
      facetSidebarNodes = []
    }
    return (
      <details className="c-facetbox" open={this.props.open}>
        {/* Each facetbox needs a distinct <span id> and <fieldset aria-labelledby> matching value */}
        <summary className="c-facetbox__summary"><span id={this.props.index}>{data.display}</span></summary>
          <fieldset aria-labelledby={this.props.index}>
            {facetSidebarNodes}
          {modal &&
            <div id={`facetModalBase-${data.fieldName}`}>
              <button className="c-facetbox__show-more"
                      onClick={(event)=>{
                                this.setState({modalOpen:true})
                                event.preventDefault()}
                              }>
                Show more
              </button>
              <ModalComp isOpen={this.state.modalOpen}
                parentSelector={()=>$(`#facetModalBase-${data.fieldName}`)[0]}
                header={"Refine By " + data.display}
                onOK={e=>this.closeModal(e, data.fieldName)} okLabel="Done"
                onCancel={e=>this.closeModal(e, data.fieldName)}
                content={ <div>{ this.getFacetNodes(data.facets) }</div> }
              />
            </div>
          }
          </fieldset>
      </details>
    )
  }
}

// FacetForm manages the state for FacetItems and FilterComp in the sidebar.
// FacetItems are grouped by the FacetFieldset component.
// All interactions with faceting search parameters get propagated up to FacetForm
// and then down to their respective components before issuing the search query
// to update the scholarly works list (main column of search results)
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
//     info_start: '0',
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
  state={ query: this.props.query,
          refineActive: false,
          drawerOpen: false }

  widthChange = ()=> {
    this.setState({refineActive: this.mq.matches, drawerOpen: this.mq.matches})
  }

  componentDidMount() {
    if (!(typeof matchMedia === "undefined")) {
      this.mq = matchMedia("(min-width:"+Breakpoints.screen1+")")
      this.mq.addListener(this.widthChange)
      this.widthChange()
    }
  }

  // Called by FacetFieldset's handleChange function
  changeFacet = (event, fieldsetQuery, fieldType)=>{
    let newQuery = $.extend(true, {}, this.state.query) // true=deep copy
    if (fieldsetQuery) {
      newQuery.filters[fieldType] = fieldsetQuery
    } else {
      delete newQuery.filters[fieldType]
    }
    this.setState({query: newQuery})
  }

  // Set as the onClick handler for FilterComp's active filter buttons
  removeFilters = event=>{
    let newQuery = $.extend(true, {}, this.state.query) // true=deep copy
    let fieldType = $(event.target).data('filter-type')
    delete newQuery.filters[fieldType]
    this.setState({query: newQuery})
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props.query, nextProps.query))
      this.setState({query: nextProps.query})
  }

  render() {
    let p = this.props
    let facetForm = this.props.data.facets.map((fieldset, i) => {
      let fieldName = fieldset.fieldName
      let filters = this.state.query.filters && this.state.query.filters[fieldName] ? this.state.query.filters[fieldName] : {}
      let facets = fieldset.facets
      return (
        <FacetFieldset key={fieldName} index={"facetbox" + i} data={fieldset} query={filters}
                       handler={this.changeFacet}
                       // Have first two open by default
                       open={[0,1].includes(i)} />
      )
    })

    return (
      <div>
        {/* Top-aligned box with title "Your search: "Teletubbies"" and active filters */}
        <FilterComp query={this.state.query} count={p.data.count} info_count={p.info_count} handler={this.removeFilters}/>
        <div className={this.state.refineActive ? "c-refine--no-drawer" : "c-refine--has-drawer"}>
          <button className="c-refine__button--open" onClick={()=> this.setState({drawerOpen: true})} hidden={this.state.drawerOpen}>Refine Results</button>
          <button className="c-refine__button--close" onClick={()=> this.setState({drawerOpen: false})} hidden={!this.state.drawerOpen}>Back to Results</button>
          <div className={this.state.drawerOpen ? "c-refine__drawer--opened" : "c-refine__drawer--closed"}>
            {facetForm}
          </div>
        </div>
        {/* Submit button needs to be present so our logic can "press" it at certain times.
            But hide it with display:none so user doesn't see it. */}
        <button type="submit" id={p.formButton} style={{display: "none"}}>Search</button>
      </div>
    )
  }
}

class SearchPage extends PageBase {
// Rough outline of props. More detail available in components above
// data = {
//   infoResults: [ {ancestor_id: 'uclalaw_jinel', ancestor_name: 'Journal of Islami...',
//       target_id: 'facultyAdvisors', target_name: 'Faculty Advisors', content: 'Crepuscular Sheep'}, ... ] 
//   info_count: 12,
//   query: PropTypes.shape({
//     q: PropTypes.string,
//     rows: PropTypes.string,
//     sort: PropTypes.string,
//     info_start: PropTypes.string,
//     start: PropTypes.string,
//   }).isRequired,
//   searchResults: [ {id: "qt5jf69563", title: "Pulmonaria", abstract: "<p>A collection of ...",
//      content_type: "application/pdf", authors: [{"name"=>"Gilad Silver, Liza"}],
//      supp_files: [{:type=>"pdf", :count=>0}, {:type=>"image", :count=>0}, {:type=>"video", :count=>0},
//        {:type=>"audio", :count=>0}, {:type=>"zip", :count=>0}, {:type=>"other", :count=>0}],
//      thumbnail: {"width"=>121, "height"=>160, "asset_id"=> "1a43ecb4f4c85ff...",
//        "timestamp": 1416881075, "image_type"=>"png"},
//      pub_year: 2014, genre: "dissertation", rights: nil, peerReviewed: true,
//      unitInfo: {displayName: "UC Riverside Electronic Theses and Dissertations", unitId: "ucr_etd"}}, ...]
//   count: 331,
//   facets: [ {display: 'Type of Work', fieldName: 'type_of_work', facets: []} ]

  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    return "/api/search/" + this.props.location.search  // plus whatever props.match.params.YourUrlParam, etc.
  }

  formFilter = (data) => {
    let out = {}
    for(let key in data) {
      if (data[key] == "" ||
          (key === 'sort' && data[key] === 'rel') ||
          (key === 'rows' && data[key] === '10') ||
          (key === 'start' && data[key] === '0'))
      {
        continue
      }
      out[key] = data[key]
    }
    return out
  }

  renderData(data) {
    let facetFormData = {facets: data.facets, count: data.count},
        formName = "facetForm",
        formButton = "facet-form-submit"
    return(
      <div className="l_search">
        <MetaTagsComp title="Search"/>
        <Header2Comp searchComp="1" query={this.props.location.query} />
        <div className="c-navbar">
          <NavComp data={data.header.nav_bar} />
        </div>
        {/* <ExportComp /> */}
        <FormComp id={formName} to='/search' filter={this.formFilter} className="c-columns">
          <aside>
            <FacetForm formName={formName} formButton={formButton} data={facetFormData} info_count={data.info_count} query={data.query} />
          </aside>
          <main id="maincontent" tabIndex="-1">
            {data.info_count > 0 &&
              <section className={this.state.fetchingData ? "o-columnbox1 is-loading-data" : "o-columnbox1"}>
                <header>
                  <h2 className="o-columnbox1__heading">{"Informational Pages ("+data.info_count+" results)"}</h2>
                </header>
                <InfoPagesComp query={data.query} info_count={data.info_count} infoResults={data.infoResults} />
              </section>
            }
            <section className={this.state.fetchingData ? "o-columnbox1 is-loading-data" : "o-columnbox1"}>
              <header>
                <h2 className="o-columnbox1__heading">
                  Scholarly Works ({data.count + " results" + (data.count > 10000 ? ", showing first 10000" : "")})</h2>
              </header>
              {(data.count > 2) &&
                <SortPaginationComp formName={formName} formButton={formButton} query={data.query} count={data.count}/>
              }
              {(data.count != 0 ) ?
                data.searchResults.map(result =>
                  <ScholWorksComp h="h3" key={result.id} result={result} />)
              :
                <div className="o-well-large">No results found.</div>
              }
              {(data.count > data.query.rows) &&
                <PaginationComp formName={formName} formButton={formButton} query={data.query} count={data.count}/>
              }
            </section>
          </main>
        </FormComp>
      </div>
  )}
}

export { FacetItem, PubYear, FacetFieldset, FacetForm, SearchPage }
