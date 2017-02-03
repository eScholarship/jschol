
import React from 'react'
import { Link } from 'react-router'
import $ from 'jquery'
import _ from 'lodash'
import { Subscriber } from 'react-broadcast'

import PageBase from './PageBase.jsx'
import Header1Comp from '../components/Header1Comp.jsx'
import Nav1Comp from '../components/Nav1Comp.jsx'
import BreadcrumbComp from '../components/BreadcrumbComp.jsx'
import SidebarNavComp from '../components/SidebarNavComp.jsx'

class StaticPage extends PageBase
{
  static propTypes = {
    params: React.PropTypes.shape({
      unitID:   React.PropTypes.string.isRequired,
      pageName: React.PropTypes.string.isRequired
    }).isRequired
  }

  // PageBase will fetch the following URL for us, and place the results in this.state.pageData
  pageDataURL() {
    return "/api/static/" + this.props.params.unitID + "/" + this.props.params.pageName
  }

  // OK to display the Edit Page button if user is logged in
  isPageEditable() {
    return true
  }

  // PageBase calls this when the API data has been returned to us
  renderData = data => { return(
    <div className="l-about">
      <Header1Comp/>
      <Nav1Comp campuses={data.campuses} />
      <BreadcrumbComp array={data.breadcrumb} />
      <Subscriber channel="adminLogin">
        { adminLogin =>
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
              <Editable onSave={(t)=>this.onSaveContent(t, adminLogin)} {...data.page} >
                <StaticContent {...data.page}/>
              </Editable>
              { this.state.admin && this.state.admin.editingPage &&
                <button>Delete this page</button> }
            </main>
            <aside>
              { data.sidebarWidgets.map(widgetData => 
                <Editable key={widgetData.id} 
                          onSave={(t)=>this.onSaveWidgetText(widgetData.id, t, adminLogin)} 
                          canDelete
                          {...widgetData}>
                  <SidebarWidget {...widgetData}/>
                </Editable>
              ) }
              { this.state.admin && this.state.admin.editingPage &&
                <button>Add widget</button> }
            </aside>
          </div>
        }
      </Subscriber>
    </div>)
  }

  onSaveContent(newText, adminLogin) {
    return $
    .ajax({ url: `/api/static/${this.props.params.unitID}/${this.props.params.pageName}/mainText`,
          type: 'PUT', data: { token: adminLogin.token, newText: newText }})
    .done(()=>{
      this.fetchPageData()  // re-fetch page state after DB is updated
    })
  }

  onSaveWidgetText(widgetID, newText, adminLogin) {
    return $
    .ajax({ url: `/api/widget/${this.props.params.unitID}/${widgetID}/text`,
          type: 'PUT', data: { token: adminLogin.token, newText: newText }})
    .done(()=>{
      this.fetchPageData()  // re-fetch page state after DB is updated
    })
  }
}

// Formatting buttons to display in the Trumbowyg editor
const TRUMBO_BUTTONS = [
  ['strong', 'em', 'underline', 'strikethrough'],
  ['superscript', 'subscript'],
  ['link'],
  ['insertImage'],
  'btnGrp-lists',
  ['horizontalRule'],
  ['removeformat']
]

class Editable extends React.Component
{
  static propTypes = {
    children: React.PropTypes.element.isRequired,
    html: React.PropTypes.string.isRequired,
    onSave: React.PropTypes.func.isRequired,
    canDelete: React.PropTypes.bool // optional
  }

  state = { isEditingComp: false, workingMsg: null }

  render = () =>
    <Subscriber channel="cms">
      { cms => {

        // Step 1: If not editing page, pass through to the children, unmodified.
        if (!cms.isEditingPage)
          return this.props.children

        // Step 2: Page is being edited, but component not yet being edited (nor saved)
        else if (!this.state.isEditingComp && !this.state.workingMsg)
          return this.renderWithButtons(cms)

        // Step 3: Edit button has been clicked - display the wysiwyg editor
        else if (this.state.isEditingComp)
          return this.renderEditor(cms)

        // Step 4: Save has been clicked. Display the saving message while we work.
        else
          return this.renderWorkingMsg()
      } }
    </Subscriber>

  renderWithButtons = cms =>
    <div style={{position: "relative"}}>
      { this.props.children }
      <div className="c-editable__edit-buttons">
        <button className="c-editable__edit-button"
                onClick={e=>this.setState({ isEditingComp: true })}>
          Edit
        </button>
        { this.props.canDelete && 
          <button className="c-editable__delete-button">Delete</button> }
      </div>
    </div>

  renderEditor = cms =>
    <div>
      { this.renderWithButtons(cms) }
      <div className="c-editable__modal">
        <div className="c-editable__modal-content">
          <cms.modules.Trumbowyg id='react-trumbowyg' 
                     buttons={TRUMBO_BUTTONS}
                     data={this.props.html}
                     onChange={ e => this.setState({ newText: e.target.innerHTML })} />
          <button onClick={e=>this.onSave()}>Save</button>
          <button onClick={e=>this.setState({isEditingComp:false})}>Cancel</button>
        </div>
      </div>
    </div>

  renderWorkingMsg = () =>
    <div style={{position: "relative"}}>
      { this.props.children }
      <div className="c-editable__working">
        <div className="c-editable__working-text">{this.state.workingMsg}</div>
      </div>
    </div>

  onSave() 
  {
    if (this.state.newText) {
      this.setState({ isEditingComp: false, workingMsg: "Updating..." })
      let startTime = new Date
      this.props.onSave(this.state.newText)
      .done(()=> {
        // In case save takes less than half a sec, leave the message on there
        // for long enough to see it.
        setTimeout(()=>this.setState({ workingMsg: null, newText: null }),
                   Math.max(500, new Date - startTime))
      })
      .fail(()=>{
        // Put up a "Failed" message and leave it there a little while so user can see it.
        this.setState({ workingMsg: "Failed." })
        setTimeout(()=>this.setState({workingMsg: null, newText: null}), 1000)
      })
    }
    else
      this.setState({ isEditingComp: false })
  }
}

class SidebarWidget extends React.Component
{
  static propTypes = {
    title: React.PropTypes.string.isRequired,
    html: React.PropTypes.string.isRequired
  }

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
  static propTypes = {
    title: React.PropTypes.string.isRequired,
    html: React.PropTypes.string.isRequired
  }

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
