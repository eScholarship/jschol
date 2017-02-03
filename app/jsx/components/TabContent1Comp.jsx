// ##### Item Page - "Tab 1" Main Content Component ##### //

import React from 'react'
import ItemActionsComp from '../components/ItemActionsComp.jsx'
import AuthorListComp from '../components/AuthorListComp.jsx'
import PdfViewerComp from '../components/PdfViewerComp.jsx'
import PublishedLocationComp from '../components/PublishedLocationComp.jsx'

class TabContent1Comp extends React.Component {
  render() {
    let p = this.props
    return (
      <div className="c-tabcontent">
        <ItemActionsComp />
        <h1 className="c-tabcontent__heading">{p.title}</h1>
        <AuthorListComp pubdate={p.pub_date} authors={p.authors} changeTab={this.props.changeTab} />
        <PublishedLocationComp loc={p.attrs["pub_web_loc"]} />
        {p.attrs["abstract"] &&
          <details className="c-togglecontent" open>
            <summary><h2>Abstract</h2></summary>
            <p>{p.attrs["abstract"]}</p>
            {/* ToDo: Determine how this content is coming in */}
            <p className="c-well">***OPEN ACCESS POLICY*** Libero dolores rerum nesciunt deserunt incidunt, aspernatur similique fugit beatae quis impedit corrupti, voluptate, unde facilis. Voluptatibus labore sunt maxime, accusantium animi mollitia ducimus.</p>
          </details>
        }
        <Content {...p} />
      </div>
    )
  }
}

class Content extends React.Component {
  render() {
    switch(this.props.status) {
      case "published":
        return this.renderContent(this.props)
        break;
      case "withdrawn":
        return this.renderNoContent("withdrawn", this.props.attrs['withdrawn_date'])
        break;
      case "embargoed":
        return this.renderNoContent("embargoed", this.props.attrs['embargo_date'])
        break;
    }
  }

  renderContent = p => { return (
      p.content_type == "application/pdf" ? this.renderPdf(p) :
        p.content_type == "text/html" ? this.renderHtml(p) : null
  )}

  renderPdf = p => { return (
      <details className="c-togglecontent" open>
        <summary><h2>Main Content</h2></summary>
        {/*Fetch content through server app, which will check credentials and proxy to proper back-end*/}
        <PdfViewerComp url={"/content/qt" + p.id + "/qt" + p.id + ".pdf"}/>
      </details>
  )}

  renderHtml = p => { return (
      <details className="c-togglecontent" open>
        <summary><h2>Main Content</h2></summary>
        <div dangerouslySetInnerHTML={{__html: p.content_html}}/>
        <br/><br/>
      </details>
  )}

  renderNoContent = (reason, date) => { return (
      <details className="c-togglecontent" open>
        <summary><h2>Main Content</h2></summary>
        {reason=="withdrawn" &&
          <p>Withdrawn item:<br/>This item has been withdrawn.<br/><br/><br/></p>}
        {reason=="embargoed" &&
          <p>This item is embargoed until {date}.<br/><br/><br/></p>}
      </details>
  )}
}

module.exports = TabContent1Comp;
