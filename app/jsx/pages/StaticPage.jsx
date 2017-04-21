
import React from 'react'
import { Link } from 'react-router'
import $ from 'jquery'
import _ from 'lodash'
import { Subscriber } from 'react-broadcast'

import PageBase from './PageBase.jsx'
import Subheader1Comp from '../components/Subheader1Comp.jsx'
import SidebarNavComp from '../components/SidebarNavComp.jsx'
import EditableMainContentComp from '../components/EditableMainContentComp.jsx'
import EditableSidebarTextComp from '../components/EditableSidebarTextComp.jsx'
import AdminBarComp from '../components/AdminBarComp.jsx'

export default class StaticPage extends PageBase
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

  // Unit ID for permissions checking
  pagePermissionsUnit() {
    return this.props.params.unitID;
  }

  // OK to display the Edit Page button if user is logged in
  isPageEditable() {
    return true
  }

  // PageBase calls this when the API data has been returned to us
  renderData = data => { return(
    <div>
      <AdminBarComp/>
      <Subheader1Comp navdata={[{name: 'Campus Sites', slug: ''}, {name: 'UC Open Access Policies', slug: ''}, {name: 'eScholarship Publishing', slug: ''}]} />
      <Subscriber channel="cms">
        { cms =>
          <div className="c-columns">
            <aside>
              <section className="o-columnbox1 c-sidebarnav">
                <header>
                  <h1>{data.page.title}</h1>
                </header>
                <SidebarNavComp links={data.sidebarNavLinks}/>
                { this.state.admin && this.state.admin.editingPage &&
                  <button>Add page</button> }
              </section>
            </aside>
            <main id="maincontent">
              <EditableMainContentComp onSave={(newText)=>this.onSaveContent(newText, cms)}
                html={data.page.html} title={data.page.title}/>
              { cms.isEditingPage &&
                <button>Delete this page</button> }
            </main>
            <aside>
              { data.sidebarWidgets.map(w =>
                <EditableSidebarTextComp
                  key={w.id}
                  title={w.title} html={w.html}
                  onSave={(newText)=>this.onSaveWidgetText(w.id, newText, cms)}/>
              ) }
              { cms.isEditingPage &&
                <button>Add widget</button> }
            </aside>
          </div>
        }
      </Subscriber>
    </div>
  )}

  onSaveContent(newText, cms) {
    return $
      .ajax({ url: `/api/static/${this.props.params.unitID}/${this.props.params.pageName}/mainText`,
            type: 'PUT', data: { username: cms.username, token: cms.token, newText: newText }})
      .done(()=>{
        this.fetchPageData()  // re-fetch page state after DB is updated
      })
  }

  onSaveWidgetText(widgetID, newText, cms) {
    return $
    .ajax({ url: `/api/widget/${this.props.params.unitID}/${widgetID}/text`,
          type: 'PUT', data: { username: cms.username, token: cms.token, newText: newText }})
    .done(()=>{
      this.fetchPageData()  // re-fetch page state after DB is updated
    })
  }
}
