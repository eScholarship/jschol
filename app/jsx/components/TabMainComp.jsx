// ##### Tab Main Content Component ##### //

import React from 'react'
import ItemActionsComp from '../components/ItemActionsComp.jsx'
import AuthorListComp from '../components/AuthorListComp.jsx'
import PdfViewComp from '../components/PdfViewComp.jsx'
import PubLocationComp from '../components/PubLocationComp.jsx'
import PubDataComp from '../components/PubDataComp.jsx'

class TabMainComp extends React.Component {
  render() {
    let p = this.props
    return (
      <div className="c-tabcontent">
        <ItemActionsComp status={p.status} content_type={p.content_type} id={p.id} />
        <h1 className="c-tabcontent__heading" tabIndex="-1">{p.title}</h1>
        <AuthorListComp pubdate={p.pub_date} authors={p.authors} changeTab={p.changeTab} />
        <PubLocationComp pub_web_loc={p.attrs.pub_web_loc} rights={p.rights} />
        <PubDataComp content_type={p.content_type} />
        {this.props.attrs.abstract && (this.props.status != "withdrawn") &&
          <Abstract status={p.status} abstract={p.attrs.abstract} /> }
        <MainText {...p} />
      </div>
    )
  }
}

class Abstract extends React.Component {
  render() {
    return (
      <details className="c-togglecontent" open>
        <summary>Abstract</summary>
        <p>{this.props.abstract}</p>
        {/* ToDo: Add Link */}
        <p className="c-well">Many UC-authored scholarly publications are freely available on this site because of the UC Academic Senate&apos;s Open Access Policy. *** LINK *** Let us know how this access is important for you.</p>
      </details>
    )
  }
}

class MainText extends React.Component {
  render() {
    let p = this.props
    if (!p.content_type) return (<NoContent pub_web_loc={p.attrs.pub_web_loc} />)
    switch(p.status) {
      case "published":
        return (p.content_type == "application/pdf" ?
                  <PdfViewComp url={"/content/qt" + p.id + "/qt" + p.id + ".pdf"}/>
                  :
                  p.content_type == "text/html" ? this.renderHtml(p) : null)
      case "withdrawn":
        return (<Withdrawn message={p.attrs.withdrawn_message} />)
      case "embargoed":
        return (<Embargoed date={p.attrs.embargo_date} pub_web_loc={p.attrs.pub_web_loc}/>)
    }
  }

  renderPdf = p => { return (
      <details className="c-togglecontent" open>
        <summary>Main Content</summary>
        {/*Fetch content through server app, which will check credentials and proxy to proper back-end*/}
        <PdfViewComp url={"/content/qt" + p.id + "/qt" + p.id + ".pdf"}/>
      </details>
  )}

  renderHtml = p => { return (
      <details className="c-togglecontent" open>
        <summary>Main Content</summary>
        <div dangerouslySetInnerHTML={{__html: p.content_html}}/>
        <br/><br/>
      </details>
  )}

}

class Withdrawn extends React.Component {
  render() {
    return (
      <div>{this.props.message || "This item has been withdrawn."}</div>
    )
  }
}

class Embargoed extends React.Component {
  render() {
    return (
      <div>
        <p>This item is under embargo until {this.props.date}</p>
        {(this.props.pub_web_loc.length > 0) &&
          <div>
          <p>You may have access to the publisher&apos;s version here:</p>
          <p><a href={this.props.pub_web_loc[0]}>{this.props.pub_web_loc[0]}</a></p>
          </div> }
        {/*Phase 2: Notify me by mail when this item become available. */}
      </div>
    )
  }
}

class NoContent extends React.Component {
  render() {
    return (
      <div>
      {(this.props.pub_web_loc.length > 0) &&
        <div>
          <p><a href={this.props.pub_web_loc[0]}>View on external site</a></p>
          <p>Item not freely available? Link broken?</p>
          <p>****  Link: Report a problem accessing this item.</p>
        </div>
      }
      <p>&nbsp;</p>
      <p>&nbsp;</p>
      <p>&nbsp;</p>
      </div>
    )
  }
}

module.exports = TabMainComp;
