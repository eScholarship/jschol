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

class DrawerComp extends React.Component {
  state = this.setupState(this.props)

  setupState(props) {
    return {
      sidebarList: props.data.sidebar,
      navList: this.navItems(props.data.header.nav_bar)
    }
  }

  navItems(navBar) {
    if (!navBar)
      return undefined
    return navBar.map(nav => {
      let data = { id: nav.id, type: nav.type, title: nav.name }
      if (nav.type == "folder")
        data.children = this.navItems(nav.sub_nav)
      else
        data.noChildren = true
      return data
    })
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
      if (data.slug)
        this.props.router.push(`/uc/${this.props.data.unit.id}/${data.slug}`)
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

        <cms.modules.SortableTree
          treeData={this.state.navList}
          isVirtualized={false}
          scaffoldBlockPxWidth={30}
          maxDepth={2}
          canDrop={({ node, nextParent }) => !nextParent || !(nextParent.noChildren || node.type == nextParent.type)}
          onChange={treeData=>this.setState({navList: treeData})}/>

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
            <cms.modules.Sidebar sidebar={this.state.navList ? this.drawerContent(cms) : <div/>}
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
