
import React from 'react'
import { Link } from 'react-router'
import $ from 'jquery'
import _ from 'lodash'

import PageBase from './PageBase.jsx'
import HeaderComp from '../components/HeaderComp.jsx'
import NavComp from '../components/NavComp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import SidebarNavComp from '../components/SidebarNavComp.jsx'

class StaticPage extends PageBase
{
  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL(props) {
    return "/api/static/" + props.params.unitID + "/" + props.params.pageName
  }

  // OK to display the Edit Page button if user is logged in
  hasEditableComponents() {
    return true
  }

  // PageBase calls this when the API data has been returned to us
  renderData(data) { return(
    <div className="l-about">
      <HeaderComp admin={this.state.admin} />
      <NavComp />
      <BreadcrumbComp array={data.breadcrumb} />
      <div className="c-columns">
        <aside>
          <section className="o-columnbox2 c-sidebarnav">
            <header>
              <h1 className="o-columnbox2__heading">{data.page.title}</h1>
            </header>
            <SidebarNavComp links={data.sidebarNavLinks}/>
            { this.state.admin && this.state.admin.editingPage &&
              <button>Add page</button> }
          </section>
        </aside>
        <main>
          <Editable admin={this.state.admin} onSave={(t)=>this.onSaveContent(t)} {...data.page} >
            <StaticContent {...data.page}/>
          </Editable>
          { this.state.admin && this.state.admin.editingPage &&
            <button>Delete this page</button> }
        </main>
        <aside>
          { data.sidebarWidgets.map(widgetData => 
            <Editable key={widgetData.id} 
                      admin={this.state.admin} 
                      onSave={(t)=>this.onSaveWidgetText(widgetData.id, t)} 
                      canDelete
                      {...widgetData}>
              <SidebarWidget {...widgetData}/>
            </Editable>
          ) }
          { this.state.admin && this.state.admin.editingPage &&
            <button>Add widget</button> }
        </aside>
      </div>
    </div>
  )}

  onSaveContent(newText) {
    return $
    .ajax({ url: `/api/static/${this.props.params.unitID}/${this.props.params.pageName}/mainText`,
          type: 'PUT', data: { token: this.state.admin.token, newText: newText }})
    .done(()=>{
      this.fetchState(this.props)  // re-fetch page state after DB is updated
    })
  }

  onSaveWidgetText(widgetID, newText) {
    return $
    .ajax({ url: `/api/widget/${this.props.params.unitID}/${widgetID}/text`,
          type: 'PUT', data: { token: this.state.admin.token, newText: newText }})
    .done(()=>{
      this.fetchState(this.props)  // re-fetch page state after DB is updated
    })
  }
}

class Editable extends React.Component
{
  state = { editingComp: false, savingMsg: null }

  render() { 
    let p = this.props;
    if (!p.admin || !p.admin.editingPage)
      return p.children
    else if (this.state.editingComp) {
      let Trumbowyg = p.admin.cmsModules.Trumbowyg
      return(
        <div className="c-staticpage__modal">
          <div className="c-staticpage__modal-content">
            <Trumbowyg id='react-trumbowyg' 
                       buttons={[['strong', 'em', 'underline', 'strikethrough'],
                                 ['superscript', 'subscript'],
                                 ['link'],
                                 ['insertImage'],
                                 'btnGrp-lists',
                                 ['horizontalRule'],
                                 ['removeformat']
                                ]}
                       data={p.html}
                       onChange={ e => this.setState({ newText: e.target.innerHTML })} />
            <button onClick={e=>this.save()}>Save</button>
            <button onClick={e=>this.setState({editingComp:false})}>Cancel</button>
          </div>
        </div>
      )
    }
    else if (this.state.savingMsg) {
      return (
        <div style={{position: "relative"}}>
          { p.children }
          <div className="c-staticpage__working">
            <div className="c-staticpage__working-text">{this.state.savingMsg}</div>
          </div>
        </div>
      )
    }
    else {
      return (
        <div style={{position: "relative"}}>
          { p.children }
          <div className="c-staticpage__edit-buttons">
            <button className="c-staticpage__edit-button"
                    onClick={e=>this.setState({ editingComp: true })}>
              Edit
            </button>
            { p.canDelete && 
              <button className="c-staticpage__delete-button">Delete</button> }
          </div>
        </div>
      )
    }
  }

  save() 
  {
    if (this.state.newText) {
      this.setState({ editingComp: false, savingMsg: "Updating..." })
      let startTime = new Date
      this.props.onSave(this.state.newText)
      .done(()=> {
        // In case save takes less than half a sec, leave the message on there
        // for long enough to see it.
        setTimeout(()=>this.setState({ savingMsg: null, newText: null }),
                   Math.max(250, new Date - startTime))
      })
      .fail(()=>{
        // Put up a "Failed" message and leave it there a little while so user can see it.
        this.setState({ savingMsg: "Failed." })
        setTimeout(()=>this.setState({savingMsg: null, newText: null}), 1000)
      })
    }
    else
      this.setState({ editingComp: false })
  }
}

class SidebarWidget extends React.Component
{
  render() { return(
    <section className="o-columnbox2 c-sidebarnav">
      <header>
        <h1 className="o-columnbox2__heading">{this.props.title}</h1>
      </header>
      <nav className="c-sidebarnav" dangerouslySetInnerHTML={{__html: this.props.html}}/>
    </section>)
  }
}

class StaticContent extends React.Component
{
  render() { return(
    <section className="o-columnbox1">
      <header>
        <h1 className="o-columnbox1__heading">{this.props.title}</h1>
      </header>
      <div dangerouslySetInnerHTML={{__html: this.props.html}}/>
    </section>
  )}
}

module.exports = StaticPage;
