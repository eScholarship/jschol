import React from 'react'
import { Subscriber } from 'react-broadcast'
import { Link } from 'react-router'
import Sidebar from 'react-sidebar'
import { sortable } from 'react-sortable'

class DrawerItem extends React.Component {
  state = {editing: false, type: this.props.navItem.slug ? 
    'page' : this.props.navItem.url ? 
    'url' : this.props.navItem.file ? 
    'file' : this.props.navItem.sub_nav ? 
    'sub_nav' : undefined
  }
  
  getNavItemJSX(navItem) {
    var link;
    if ('url' in navItem) {
      return (
        <a href={navItem.url} key={navItem.name}>
          {navItem.name}
        </a>
      )
    }
    if ('slug' in navItem) {
      return (
        <Link key={navItem.slug} to={"/unit/" + this.props.unit.id + "/" + navItem.slug }>{navItem.name}</Link>
      )
    }
    //TODO: if ('file' in navItem)...
    if ('file' in navItem) {
      return (
        <a>{navItem.name}</a>
      )
    }
    return undefined
  }

  editItem = () => {
    this.setState({editing: true});
  }
  
  onSave = () => {
    this.setState({editing: false});
  }
  
  cancel = () => {
    this.setState({editing: false});
  }
  
  deleteItem = () => {
    console.log('deleteItem');
  }

// radio buttons replaced by <select>
          // <label className="c-drawer__list-item-radio-input">
          //   <input id="navItemType" type="radio"
          //     name='navItemType' value="Page" onChange={e => console.log(e)} checked={this.state.type === 'page' ? true : false}/>
          //   Page
          // </label>
          // <label className="c-drawer__list-item-radio-input">
          //   <input id="navItemType" type="radio"
          //     name='navItemType' value="URL" onChange={e => console.log(e)} checked={this.state.type === 'url' ? true: false}/>
          //   URL
          // </label>
          // <label className="c-drawer__list-item-radio-input">
          //   <input id="navItemType" type="radio"
          //     name='navItemType' value="File" onChange={e => console.log(e)} checked={this.state.type === 'file' ? true: false}/>
          //   File
          // </label><br/>


  render() {
    if (this.state.editing || this.props.navItem.name === '') {
      var buttons = ([
        <button onClick={e => this.onSave()}>Save</button>,
        <button onClick={e => this.cancel()}>Cancel</button>,
        <button onClick={e => this.deleteItem()}>Delete</button>
      ])
      var config;
      if (this.props.navItem.sub_nav) {
        config = <SortableList data={this.props.navItem.sub_nav} unit={this.props.unit}/>
      } else {
        config = [
          <label className="c-drawer__list-label" htmlFor="navItemData">
            {this.props.navItem.slug ? "Slug: " : this.props.navItem.url ? "URL: " : this.props.navItem.file ? "File: " : ""}
          </label>,
          <input className="c-drawer__list-item-text-input" id="navItemData" onChange={e => console.log(e)}
            name='navItemData' value={this.props.navItem.slug ? this.props.navItem.slug : this.props.navItem.url ? this.props.navItem.url : ''}/>
        ]
      }
      return (
        <div className="c-drawer__list-item">
          {this.props.navItem.name === '' ? 
            <label className="c-drawer__list-label" style={{marginBottom: '9px'}}>Page Name:</label> : 
            <label className="c-drawer__list-hidden-label">Navigation Item Label (to appear in the Nav Bar):</label>
          }
          <input id="navItemName" className="c-drawer__list-item-text-input nav-element"
            name='navItemName' value={this.props.navItem.name} onChange={e => console.log(e)}/>
          
          <select value={this.state.type} style={{marginBottom: '10px'}} onChange={e => console.log(e)}>
            <option value="page">Page</option>
            <option value="url">URL</option>
            <option value="file">File</option>
            <option value="sub_nav">Folder</option>
          </select>
          {config}
          {buttons}
        </div>
      )
    } else {
      var buttons = (
        <div className="c-drawer__nav-buttons">
          <button onClick={e => this.editItem()}><img src="/images/icon_gear-black.svg"/></button>
        </div>
      )

      if ('sub_nav' in this.props.navItem) {
        return (
          <div className="c-drawer__list-item-subnav">
            <div className="c-drawer__list-item-subnav-header">
              {this.props.navItem.name}
              {buttons}
            </div>
          </div>
        )
      } else {
        return (
          <div className="c-drawer__list-item">
            {this.getNavItemJSX(this.props.navItem)}
            {buttons}
          </div>
        )
      }      
    }
  }
}

class ListItem extends React.Component {
  static displayName = 'SortableListItem';
  
  render() {
    return (
      <div {...this.props} className={this.props.className}>{this.props.children}</div>
    )
  }
}

const SortableListItem = sortable(ListItem);

class SortableList extends React.Component {
  state = {draggingIndex: null, data: this.props.data, lastPos: null}
  
  updateState = (obj) => {
    if (obj.draggingIndex === null) {
      console.log('dropped: ')
      console.log(JSON.stringify(this.state.data));
      console.log(obj);
    } else {
      this.setState({draggingIndex: obj.draggingIndex, lastPos: obj.data});
      console.log('moving:')
      console.log(JSON.stringify(this.state.data));
    }
    // this.setState(obj);
  }
  
  render() {
    var listItems = this.state.data.map((item, i) => {
      return (
        <SortableListItem
          key={i}
          updateState={this.updateState}
          items={this.state.data}
          draggingIndex={this.state.draggingIndex}
          sortId={i}
          outline="list"
          ><DrawerItem navItem={item} unit={this.props.unit}/></SortableListItem>
      );
    });
    
    return (
      <div className="list">{listItems}</div>
    )
  }
  
}

class DrawerComp extends React.Component {
  state = {
    navList: 'header' in this.props.data && 'nav_bar' in this.props.data.header ? this.props.data.header.nav_bar : undefined,
  };

  onSetSideBarOpen(open) {
    this.setState({sidebarOpen: open});
  }
  
  addNavItem = () => {
    var navList = this.state.navList;
    navList.push({name: ""});
    this.setState({navList: navList});
  }
  
  addSidebarItem = () => {
    console.log("add an item below the last sidebar widget item in drawer. item is a drop down to select widget type; then navigate to /sidebar page")
  }
  
  addFolder = () => {
    console.log('add folder!');
  }
  
  render() {
    var data = this.state.navList
    
    //BIG buttons at the bottom of the drawer for adding an item
        // <div className="c-drawer__add-buttons">
    //       <div className="c-drawer__add-item">
    //         <button onClick={e => this.addNavItem()}><img src="/images/white/plus.svg"/></button>
    //       </div>
    //       <div className="c-drawer__add-folder">
    //         <button onClick={e => this.addFolder()}><img src="/images/white/folder.svg"/></button>
    //       </div>
    //     </div>
    //
    var buttons = (
      <div className="c-drawer__nav-buttons">
        <button onClick={e => console.log('reveal drop down to select widget type?')}><img src="/images/icon_gear-black.svg"/></button>
      </div>
    )
    
    var sidebarContent = data ? (
      <div>
        <div className="c-drawer__list-item" style={{backgroundImage: 'none', paddingLeft: '20px'}}>
          <Link key="profile" to={"/unit/" + this.props.data.unit.id + "/profile" }>
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
          <div className="c-drawer__nav-buttons">
            <button onClick={e => this.addNavItem()}><img src="/images/white/plus.svg"/></button>
          </div>
        </div>
        <SortableList data={this.state.navList} unit={this.props.data.unit}/>
        
        <div className="c-drawer__heading">
          Sidebar Widgets
          <div className="c-drawer__nav-buttons">
            <button onClick={e => this.addSidebarItem()}><img src="/images/white/plus.svg"/></button>
          </div>
        </div>
        <div className="c-drawer__list-item">
          <Link key="sidebar-featured-articles" to={"/unit/" + this.props.data.unit.id + "/sidebar#featured-articles" }>
            Featured Articles
          </Link>
            {buttons}
        </div>
        <div className="c-drawer__list-item">
          <Link key="sidebar-twitter-feed" to={"/unit/" + this.props.data.unit.id + "/sidebar#twitter-feed" }>
            Twitter Feed
          </Link>
            {buttons}
        </div>
        <div className="c-drawer__list-item">
          <Link key="sidebar-twitter-feed" to={"/unit/" + this.props.data.unit.id + "/sidebar#other-widgets" }>
            Other Widgets?
          </Link>
            {buttons}
        </div>
      </div>
    ) : (<div></div>);
    return (
      <Subscriber channel="cms">
        { cms =>  
          ('header' in this.props.data && 'nav_bar' in this.props.data.header) ?
            <Sidebar 
              sidebar={sidebarContent} 
              open={cms.isEditingPage}
              docked={cms.isEditingPage} 
              onSetOpen={this.onSetSidebarOpen}
              sidebarClassName="c-drawer">
        
              {this.props.children}
            </Sidebar> : <div>{this.props.children}</div>
        }
      </Subscriber>
    )
  }
}

module.exports = DrawerComp;
