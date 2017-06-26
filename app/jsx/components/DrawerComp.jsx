import React from 'react'
import { Subscriber } from 'react-broadcast'
import { Link } from 'react-router'
import _ from 'lodash'

class AddWidgetMenu extends React.Component {
  state = { isOpen: false }
  render() {
    return (
      <div className="c-drawer__nav-buttons" >
        <details className="c-widgetselector__selector" open={this.state.isOpen} ref={el=>this.detailsEl=el}>
          <summary aria-label="select widget type"
                   onClick={e=>setTimeout(()=>this.setState({isOpen: this.detailsEl.open}), 0)}/>
          <div className="c-widgetselector__menu">
            <div className="c-widgetselector__sub-heading" id="c-widgetselector__sub-heading">{this.props.title}</div>
            <div className="c-widgetselector__items" aria-labelledby="c-widgetselector__sub-heading" role="list"
              onClick={e=>this.setState({isOpen: false})}>
              {this.props.children}
            </div>
          </div>
        </details>
      </div>
    )
  }
}

class SortableNavList extends React.Component {
  state = this.setupState(this.props)

  setupState(props) {
    return {
      data: this.generateData(props.navItems)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props, nextProps))
      this.setState(this.setupState(nextProps))
  }

  generateData(navItems) {
    if (!navItems)
      return undefined
    return navItems.map(nav => {
      let data = { id: nav.id, type: nav.type, title: nav.name, subtitle: <i>{nav.type}</i> }
      if (nav.type == "folder")
        data.children = this.generateData(nav.sub_nav)
      else
        data.noChildren = true

      if (nav.type == "home")
        data.title = <Link to={"/uc/" + this.props.unit}>{nav.name}</Link>
      else
        data.title = <Link to={`/uc/${this.props.unit}/nav/${nav.id}`}>{nav.name}</Link>

      return data
    })
  }

  travOrder(treeData) {
    return treeData.map(item => {
      let out = { id: item.id }
      if (item.children)
        out.sub_nav = this.travOrder(item.children)
      return out
    })
  }

  onMoveNode = ({ treeData }) => {
    this.setState({ data: treeData, working: true })
    $.getJSON({ url: `/api/unit/${this.props.unit}/navOrder`,
                type: 'PUT',
                data: { order: JSON.stringify(this.travOrder(treeData)),
                        username: this.props.cms.username, token: this.props.cms.token }
              })
    .done((data)=>{
      this.setState({working: false})
      this.props.cms.fetchPageData()  // re-fetch page state after DB is updated
    })
    .fail((data)=>{
      this.setState({working: false})
      alert("Reorder failed" + (data.responseJSON ? ":\n"+data.responseJSON.message : "."))
      this.props.cms.fetchPageData()  // re-fetch page state after DB is updated
    })
  }

  render() {
    const SortableTree = this.props.cms.modules.SortableTree
    return (
      <SortableTree
        treeData={this.state.data}
        isVirtualized={false}
        scaffoldBlockPxWidth={30}
        maxDepth={2}
        canDrag={({ node }) => {
          if (node.type == "home") // don't allow dragging unit home
            return false
          return true
        }}
        canDrop={({ node, nextTreeIndex, nextParent }) => {
          if (nextTreeIndex == 0) // don't allow rearranging above the unit home
            return false
          if (!nextParent)
            return true
          if (node.type == "folder")
            return false
          if (nextParent.noChildren)
            return false
          if (nextParent.type != "folder")
            return false
          return true
        }}
        onChange={treeData => this.setState({ data: treeData })}
        onMoveNode={this.onMoveNode}/>
    )
  }
}

class DrawerComp extends React.Component {
  state = this.setupState(this.props)

  setupState(props) {
    return {
      sidebarList: props.data.sidebar
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props, nextProps))
      this.setState(this.setupState(nextProps))
  }

  onSetSideBarOpen(open) {
    this.setState({sidebarOpen: open});
  }

  addNavItem = (event, cms, navType) => {
    event.preventDefault()
    this.setState({working: true})
    $.getJSON({ type: 'POST', url: `/api/unit/${this.props.data.unit.id}/nav`,
             data: { username: cms.username, token: cms.token, navType: navType }})
    .done(data=>{
      this.setState({working: false})
      if (data.id)
        this.props.router.push(`/uc/${this.props.data.unit.id}/nav/${data.id}`)
      else
        cms.fetchPageData()
    })
    .fail(()=>{
      this.setState({working: false})
      alert("Error adding item.")
    })
  }

  addSidebarItem = () => {
    var curList = _.clone(this.state.sidebarList);
    curList.push({id: "new", title: "New widget"});
    this.setState({sidebarList: curList});
  }

  drawerContent(cms) {
    return (
      <div>
        <div className="c-drawer__list-item" style={{backgroundImage: 'none', paddingLeft: '20px'}}>
          <Link key="profile" to={"/uc/" + this.props.data.unit.id + "/profile" }>
            {
              (this.props.data.unit.type === 'journal' && 'Journal Profile') ||
              (this.props.data.unit.type === 'series' && 'Series Profile') ||
              (this.props.data.unit.type === 'campus' && 'Campus Profile') ||
              (this.props.data.unit.type && 'Unit Profile')
            }
          </Link>
        </div>

        <div className="c-drawer__heading">
          Navigation Items
          <AddWidgetMenu title="Add Nav Item">
            <a href="" key="page"   onClick={e=>this.addNavItem(e, cms, 'page')  }>Page</a>
            <a href="" key="url"    onClick={e=>this.addNavItem(e, cms, 'link')  }>Link</a>
            <a href="" key="folder" onClick={e=>this.addNavItem(e, cms, 'folder')}>Folder</a>
          </AddWidgetMenu>
        </div>

        <SortableNavList cms={cms} unit={this.props.data.unit.id} navItems={this.props.data.header.nav_bar}/>

        <div className="c-drawer__heading">
          Sidebar Widgets
          <div className="c-drawer__nav-buttons">
            <button onClick={this.addSidebarItem}><img src="/images/white/plus.svg"/></button>
          </div>
        </div>
        { this.state.sidebarList.map( sb =>
            <div key={sb.id} className="c-drawer__list-item">
              <Link to={"/uc/" + this.props.data.unit.id + "/sidebar#" + sb.id }>
                {sb.title ? sb.title : sb.kind.replace(/([a-z])([A-Z][a-z])/g, "$1 $2")}
              </Link>
            </div>
          )
        }
      </div>
    )
  }

  render = ()=>
    <Subscriber channel="cms">
      { cms =>
        <div>
          {(this.state.working || this.props.fetchingData) && <div className="c-drawer__working-overlay"/>}
          <cms.modules.Sidebar sidebar={this.drawerContent(cms)}
                   open={cms.isEditingPage}
                   docked={cms.isEditingPage}
                   onSetOpen={this.onSetSidebarOpen}
                   sidebarClassName="c-drawer">
            {this.props.children}
          </cms.modules.Sidebar>
        </div>
      }
    </Subscriber>
}

module.exports = DrawerComp;
