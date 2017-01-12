// ##### Browse Page ##### // 

import React from 'react'
import { Link } from 'react-router'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import Header2Comp from '../components/Header2Comp.jsx'
import Subheader1Comp from '../components/Subheader1Comp.jsx'
import Nav1Comp from '../components/Nav1Comp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'

class BrowsePage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL(props) {
    if (props.params.browse_type) {
      return "/api/browse/" + props.params.browse_type
    } else {
      return "/api/browse/depts/" + props.params.campusID
    }
  }

  renderData(data) {
    return (
    <div>
      {/* Campus-specific browse page */}
      { data.browse_type == "depts" &&
          <div>
            <Header2Comp type="campus" unitID={data.campusID} />
            <Subheader1Comp browse_type="depts"
                            campuses={data.campuses}
                            unitID={data.campusID}
                            unitName={data.campusName}
                            campusID={data.campusID}
                            campusName={data.campusName} />  </div> }
      {/* Global browse page */}
      { data.browse_type != "depts" &&
          <div>
            <Header1Comp/>
            <Nav1Comp campuses={data.campuses} />  </div> }
      <BreadcrumbComp array={data.breadcrumb} />
      <Content
        {...data}
      />
    </div>
  )}

}

class Content extends React.Component {
  render() {
    let p = this.props
    return (
    <div>
      { p.browse_type == "campuslist" && this.renderCampuses(p) }
      { p.browse_type == "depts" && <DeptTree depts={p.depts} /> }
      { p.browse_type == "journals" && <BrowseJournals journals={p.journals}
        isActive="" campuses={p.campuses} campusID=""/> }
    </div>
  )}

  renderCampuses(p) {
    let campusList = p.campusesStats.map(function(c, i) {
        return c['id'] != "" &&
          <p key={i}><a href={"/unit/" + c['id']}>{c['name']}</a><br/>
            &nbsp;&nbsp;&nbsp;&nbsp;<StatNum item={c} /></p>
      })
    return (
    <div>
      <h2>Campuses</h2>
      <p>
Lorem ipsum dolor sit amet

consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate,

felis tellus mollis orci, sed start a journal nunc eget odio.
      </p>
      {campusList}
      <br/><br/>
    </div>
  )}

}

// Tree traversal help via http://codepen.io/anon/pen/Ftkln
// 'depts' property (JSON)
// [ ...,
//  {"id"=>"international",
//   "name"=>"UCLA International Institute",
//   "children"=>
//    [{"id"=>"asia",
//      "name"=>"UCLA Asia Institute",
//      "children"=>[{"id"=>"ccs", "name"=>"UCLA Center for Chinese Studies"}]}, .. ], } .. ]
class DeptTree extends React.Component {
  constructor(props) {
    super(props)
    this.state = { depts: this.props.depts }
    // this.onSelect = this.onSelect.bind(this)
  }
  onSelect(node) {
    if (this.state.selected && this.state.selected.isMounted()) {
      this.state.selected.setState({selected: false})
    }
    this.setState({selected: node})
    node.setState({selected: true})
    if (this.props.onCategorySelect) {
      this.props.onCategorySelect(node)
    }
  }
  render() { return (
    <div>
      <h2>Departments</h2>
      <p>
Lorem ipsum dolor sit amet

consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate,

felis tellus mollis orci, sed start a journal nunc eget odio.
      </p>
      Expand All<br/>
      <ul>
        { this.props.depts.map((node) =>
            <TreeNode key={node.id} depts={node} onCategorySelect={this.onSelect}/>) }
      </ul>
    </div>
  )}
}

class TreeNode extends React.Component {
  constructor(props) {
    super(props)
    this.state = { children: this.props.depts.children }
    this.onCategorySelect = this.onCategorySelect.bind(this)
    this.onChildDisplayToggle = this.onChildDisplayToggle.bind(this)
  }
  onCategorySelect(ev) {
    if (this.props.onCategorySelect) {
      this.props.onCategorySelect(this)
    }
    ev.preventDefault()
    ev.stopPropagation()
  }
  onChildDisplayToggle(ev) {
    if (this.props.depts.children) {
      if (this.state.children && this.state.children.length) {
        this.setState({children: null})
      } else {
        this.setState({children: this.props.depts.children})
      }
    }
    ev.preventDefault()
    ev.stopPropagation()
  }
  render() {
    if (!this.state.children) this.state.children = []
    return (
      <li ref="node" onClick={this.onChildDisplayToggle}>
        <Link onClick={this.onCategorySelect} to={"/unit/" + this.props.depts.id}>
          {this.props.depts.name}</Link>
          <ul>{this.state.children.map((child) =>
            <TreeNode key={child.id} depts={child} onCategorySelect={this.props.onCategorySelect}/>)}
          </ul>
      </li>
    )
  }
}

class BrowseJournals extends React.Component {
  constructor(props) {
    super(props)
    this.state = {campusID: props.campusID,
                  isActive: props.isActive}
    this.changeCampus = this.changeCampus.bind(this)
    this.changeActive = this.changeActive.bind(this)
  }

// 'journals' property (JSON)
// i.e. {:id=>"ao4elt4",
//       :name=> "Adaptive Optics ...",
//       :ancestor_unit=>["ucla", "ucsc"],
//       :is_active=>true}
  getVisibleJournals(journals, isActive, campusID) {
    let foundOne = false
    let r = journals.map(function(j, i) {
      let p = (j['is_active'] == isActive || isActive == "") &&
        (j['ancestor_unit'].includes(campusID) || campusID =="") &&
        <p key={i}><a href={"/unit/" + j["id"]}>{j["name"]}</a></p>
      if (p) {foundOne = true}
      return p
    })
    return foundOne ? r : false
  }

  changeCampus(event) {
    this.setState({campusID: event.target.value})
  }

  changeActive(event) {
    this.setState({isActive: event.target.value})
  }

  render() {
    let p = this.props,
      visibleJournals = this.getVisibleJournals(p.journals, this.state.isActive, this.state.campusID),
      campusSelector = p.campuses.map(function(c, i) {
        return <option key={i} value={c['id']}>{c['name']}</option>
      })
    return (
    <div>
      <h2>Journals</h2>
      <p>
Lorem ipsum dolor sit amet

consectetur adipiscing elit. Aenean euismod bibendum laoreet. Proin gravida dolor sit amet lacus accumsan et viverra justo commodo. Proin sodales pulvinar tempor. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam fermentum, nulla luctus pharetra vulputate,

felis tellus mollis orci, sed start a journal nunc eget odio.
      </p>
      <div className="o-input__droplist">
        <select name="isActive" id="" onChange={this.changeActive} value={this.state.isActive}>
          <option value="">All</option>
          <option value="1">Actively publishing</option>
          <option value="0">Archived</option>
        </select>
      </div>
      <div className="o-input__droplist">
        <select name="campusID" id="" onChange={this.changeCampus} value={this.state.campusID}>
          {campusSelector}
        </select>
      </div>
      {visibleJournals ? visibleJournals : <p>No journals found matching that criteria<br/><br/><br/></p>}
      <br/><br/>
    </div>
  )}
}

// StatNum displays stats (# publications, # depts, # journals) for a given campus
class StatNum extends React.Component {

  // Returns an array: [any present?, more than one?]
  statNumify(x) {
    return [ x  ? x.toLocaleString() : null, 
            x>1 ? 's' : '']
  }

  render() {
    let s1 = this.statNumify(this.props.item["publications"]),
        s2 = this.statNumify(this.props.item["units"]),
        s3 = this.statNumify(this.props.item["journals"])
    return (
      <span>
        {s1[0] && <span>{s1[0]} Publication{s1[1]}</span>}
        {s2[0] && <span>, {s2[0]} Unit{s2[1]}</span>}
        {s3[0] && <span>, {s3[0]} Journal{s3[1]}</span>}
      </span>
    )
  }
}

module.exports = BrowsePage
