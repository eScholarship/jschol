// ##### Tab Main Content Component ##### //

import React from 'react'
import ItemActionsComp from '../components/ItemActionsComp.jsx'
import AuthorListComp from '../components/AuthorListComp.jsx'
import PdfViewComp from '../components/PdfViewComp.jsx'
import PubLocationComp from '../components/PubLocationComp.jsx'
import PubDataComp from '../components/PubDataComp.jsx'
import ViewExternalComp from '../components/ViewExternalComp.jsx'

class ScrollingAnchorComp extends React.Component {
  // Used to trigger scrolling for anchors linked from JumpComp (i.e. 'article_abstract')
  render() {
    return (
      <a name={this.props.name} ref={(domElement) => {
        if (domElement &&
              window.location.hash.toLowerCase().replace(/^#/, "") == this.props.name) {
          setTimeout(() => domElement.scrollIntoView(), 0)
        }}} />
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

class MainContent extends React.Component {
  render() {
    let p = this.props
    switch(p.status) {
      case "published":
        if (!p.content_type) {
          return (<NoContent pub_web_loc={p.attrs.pub_web_loc} />)
        } else {
          return (p.content_type == "application/pdf" ?
                    <PdfViewComp url={"/content/qt" + p.id + "/qt" + p.id + ".pdf"}/>
                    :
                    p.content_type == "text/html" ? this.renderHtml(p) : null)
        }
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
      <div className="o-itemunavailable__withdrawn">
      {this.props.message ? 
        <p className="o-itemunavailable__lede">{this.props.message}</p>
        :
        <p className="o-itemunavailable__lede">This item has been withdrawn and is <strong>no longer available</strong>.</p>
      }
      </div>
    )
  }
}

class Embargoed extends React.Component {
  render() {
    let d = new Date(this.props.date),
        locale = "en-us",
        month = d.toLocaleString(locale, { month: "long" })
    return (
      <details className="c-togglecontent" open>
        <summary>Main Content</summary>
        <div className="o-itemunavailable__embargoed">
          <h2 className="o-itemunavailable__lede">This item is under embargo until
            <strong> {month + " " + d.getDay() + " " + d.getFullYear()}</strong>.</h2>
        {(this.props.pub_web_loc.length > 0) &&
          [<p key="0">You may have access to the publisher's version here:</p>,
          <a key="1" href={this.props.pub_web_loc[0]} className="o-textlink__secondary">{this.props.pub_web_loc[0]}</a>,
          <a key="2" href="" className="o-textlink__secondary">Notify me by email when this item becomes available</a>]}
        </div>
      </details>
    )
  }
}

class NoContent extends React.Component {
  render() {
    return (
      <div>
      {(this.props.pub_web_loc.length > 0) ?
        <ViewExternalComp pub_web_loc={this.props.pub_web_loc[0]} />
        :
        [<h1 key="0">CONTENT IS NULL, NO PUBLISHED WEB LOC.</h1>,
        <h1 key="1">TO BE FIXED ....</h1>,
        <h1 key="2">*OR* HERE WILL BE DISPLAYED MAIN MULTIMEDIA CONTENT NOT YET INGESTED</h1>]
      }
      <p>&nbsp;</p>
      <p>&nbsp;</p>
      <p>&nbsp;</p>
      </div>
    )
  }
}

class TabMainComp extends React.Component {
  render() {
    let p = this.props
    return (
      <div className="c-tabcontent">
        <ItemActionsComp id={p.id}
                         status={p.status}
                         content_type={p.content_type}
                         supp_files={p.attrs.supp_files}
                         buy_link={p.attrs.buy_link} />
        <h1 className="c-tabcontent__main-heading" tabIndex="-1">{p.title}</h1>
        <AuthorListComp pubdate={p.pub_date}
                        authors={p.authors}
                        changeTab={p.changeTab} />
        <PubLocationComp pub_web_loc={p.attrs.pub_web_loc}
                         rights={p.rights} />
        <PubDataComp content_type={p.content_type} />
        {this.props.attrs.abstract && (this.props.status != "withdrawn") &&
          [<ScrollingAnchorComp key="0" name="article_abstract" />,
           <Abstract key="1" status={p.status}
                             abstract={p.attrs.abstract} />] }
        <ScrollingAnchorComp name="article_main" />
        <MainContent {...p} />
      </div>
    )
  }
}

module.exports = TabMainComp;
