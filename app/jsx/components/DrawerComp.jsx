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
      data: this.generateData(props.navItems),
      firstIsHome: props.navItems[0].type == "home"
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.fetchingData && !_.isEqual(this.props, nextProps))
      this.setState(this.setupState(nextProps))
  }

  generateData(navItems) {
    if (!navItems)
      return undefined
    return navItems.map(nav => {
      let data = {
        id: nav.id,
        type: nav.type,
        slug: nav.slug,
        title: <Link to={`/uc/${this.props.unit}${(nav.type == "home") ? "" : `/nav/${nav.id}`}`}>{nav.name}</Link>,
        subtitle: <i>{nav.hidden && 'hidden '}{nav.type}</i>
      }
      if (nav.type == "folder") {
        data.children = this.generateData(nav.sub_nav)
        data.expanded = true
      }
      else
        data.noChildren = true
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
          if (node.type != "folder" && !(this.props.cms.permissions.nav_perms[node.slug] || {}).reorder)
            return false
          return true
        }}
        canDrop={({ node, nextTreeIndex, nextParent }) => {
          if (this.state.firstIsHome && nextTreeIndex == 0) // don't allow rearranging above the unit home
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
        onMoveNode={()=>this.props.onChangeOrder(this.travOrder(this.state.data))}/>
    )
  }
}

class SortableSidebarList extends React.Component {
  state = this.setupState(this.props)

  setupState(props) {
    return {
      data: this.generateData(props.sidebarWidgets)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.fetchingData && !_.isEqual(this.props, nextProps))
      this.setState(this.setupState(nextProps))
  }

  generateData(sidebarWidgets) {
    if (!sidebarWidgets)
      return undefined
    return sidebarWidgets.map(sb => { return {
      id: sb.id,
      kind: sb.kind,
      title: <Link to={`/uc/${this.props.unit}/sidebar/${sb.id}`}>
               {(sb.attrs && sb.attrs.title) ? sb.attrs.title : sb.kind.replace(/([a-z])([A-Z][a-z])/g, "$1 $2")}
             </Link>,
      subtitle: <i>{sb.kind=='Text' ? "text widget" : "built-in widget"}</i> }})
  }

  travOrder(treeData) {
    return treeData.map(item => item.id)
  }

  render() {
    const SortableTree = this.props.cms.modules.SortableTree
    return (
      <SortableTree
        treeData={this.state.data}
        isVirtualized={false}
        scaffoldBlockPxWidth={30}
        maxDepth={1}
        onChange={treeData => this.setState({ data: treeData })}
        onMoveNode={()=>this.props.onChangeOrder(this.travOrder(this.state.data))}/>
    )
  }
}

class NonSortableList extends React.Component {
  state = this.setupState(this.props)

  setupState(props) {
    return {
      data: props.items
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.fetchingData && !_.isEqual(this.props, nextProps))
      this.setState(this.setupState(nextProps))
  }

  render() {
    const SortableTree = this.props.cms.modules.SortableTree
    return (
      <SortableTree
        treeData={this.state.data}
        isVirtualized={false}
        scaffoldBlockPxWidth={30}
        maxDepth={1}
        canDrag={()=>false}
        onChange={treeData => this.setState({ data: treeData })}/>
    )
  }
}


class DrawerComp extends React.Component {

  addNavItem = (event, navType) => {
    event.preventDefault()
    this.props.sendApiData('POST', `/api/unit/${this.props.data.unit.id}/nav`, { navType: navType })
  }

  addSidebarWidget = (event, widgetKind) => {
    event.preventDefault()
    this.props.sendApiData('POST', `/api/unit/${this.props.data.unit.id}/sidebar`, { widgetKind: widgetKind })
  }

  reorderNav = (newOrder) => {
    this.props.sendApiData('PUT', `/api/unit/${this.props.data.unit.id}/navOrder`, { order: JSON.stringify(newOrder) })
  }

  reorderSidebar = (newOrder) => {
    this.props.sendApiData('PUT', `/api/unit/${this.props.data.unit.id}/sidebarOrder`, { order: JSON.stringify(newOrder) })
  }

  drawerContent(cms) {
    let siteSettings = [
      { id: "profile",
        title: <Link to={`/uc/${this.props.data.unit.id}/profile`}>
                 {(this.props.data.unit.type === 'journal' && 'Journal Profile') ||
                  (this.props.data.unit.type.includes('series') && 'Series Profile') ||
                  (this.props.data.unit.type === 'campus' && 'Campus Profile') ||
                  'Unit Profile'}
                </Link>
      }]
    if (["oru", "journal", "campus"].includes(this.props.data.unit.type)) {
      siteSettings.push({ id: "carousel", 
                          title: <Link to={`/uc/${this.props.data.unit.id}/carousel`}>Carousel Builder</Link>})
    }
    if (this.props.data.unit.type === 'journal') {
      siteSettings.push({ id: "issueConfig", 
                          title: <Link to={`/uc/${this.props.data.unit.id}/issueConfig`}>Issue Configuration</Link>})
    }
    return (
      <div>
        <div className="c-drawer__heading">Site Settings</div>

        <NonSortableList cms={cms} items={siteSettings}/>

        <div className="c-drawer__heading">
          Navigation Items
          <AddWidgetMenu title="Add Nav Item">
            <a href="" key="page"   onClick={e=>this.addNavItem(e, 'page')  }>Page</a>
            <a href="" key="url"    onClick={e=>this.addNavItem(e, 'link')  }>External Link</a>
            <a href="" key="folder" onClick={e=>this.addNavItem(e, 'folder')}>Dropdown Menu</a>
          </AddWidgetMenu>
        </div>

        <SortableNavList cms={cms}
                         unit={this.props.data.unit.id}
                         navItems={this.props.data.header.nav_bar}
                         fetchingData={this.props.fetchingData}
                         onChangeOrder={this.reorderNav}/>

        <div className="c-drawer__heading">
          Sidebar Widgets
          <AddWidgetMenu title="Add Widget">
            <a href="" key="RecentArticles" onClick={e=>this.addSidebarWidget(e, 'RecentArticles')  }>Recent Articles</a>
            <a href="" key="Text" onClick={e=>this.addSidebarWidget(e, 'Text')  }>Text</a>
          </AddWidgetMenu>
        </div>

        <SortableSidebarList cms={cms}
                             unit={this.props.data.unit.id}
                             sidebarWidgets={this.props.data.sidebar}
                             fetchingData={this.props.fetchingData}
                             onChangeOrder={this.reorderSidebar}/>
      </div>
    )
  }

  render = ()=>
    <Subscriber channel="cms">
      { cms =>
        <div>
          {this.props.fetchingData && <div className="c-drawer__working-overlay"/>}
          <cms.modules.Sidebar sidebar={this.drawerContent(cms)}
                   open={cms.isEditingPage}
                   docked={cms.isEditingPage}
                   sidebarClassName="c-drawer">
            {this.props.children}
          </cms.modules.Sidebar>
        </div>
      }
    </Subscriber>
}

module.exports = DrawerComp;
