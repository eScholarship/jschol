// ##### Tab Main Content Component ##### //

import React from 'react'
import ItemActionsComp from '../components/ItemActionsComp.jsx'
import AuthorListComp from '../components/AuthorListComp.jsx'
import PdfViewComp from '../components/PdfViewComp.jsx'
import PubLocationComp from '../components/PubLocationComp.jsx'
import PubDataComp from '../components/PubDataComp.jsx'
import ViewExternalComp from '../components/ViewExternalComp.jsx'
import { Link } from 'react-router'
import NotYetLink from '../components/NotYetLink.jsx'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import ScrollingAnchorComp from "../components/ScrollingAnchorComp.jsx"

class Abstract extends React.Component {
  render() {
    return (
      <details className="c-togglecontent" open>
        <summary>Abstract</summary>
        <ArbitraryHTMLComp html={this.props.abstract} h1Level={3}/>
        {(this.props.unit.id.match(/^.*_postprints/)) &&
          <p className="c-well">Many UC-authored scholarly publications are freely available on this site because of the
            UC Academic Senate&apos;s Open Access Policy. <NotYetLink className="" element="a">Let us know how this access is important for you.</NotYetLink>
          </p>
        }
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
          if ((p.attrs.pub_web_loc && p.attrs.pub_web_loc.length > 0) || (p.attrs.supp_files && p.attrs.supp_files.length > 0)) {
            return (<NoContent pub_web_loc={p.attrs.pub_web_loc} supp_files={p.attrs.supp_files} changeTab={p.changeTab} />)
          } else {
            return (<Withdrawn message="This item is not available from eScholarship." />)
          }
        } else {
          return (p.content_type == "application/pdf" ?
                    <PdfViewComp url={p.pdf_url}
                                 content_key={p.content_key}
                                 download_restricted={p.download_restricted}/>
                    :
                    p.content_type == "text/html" ? this.renderHtml(p) : null)
        }
      case "withdrawn":
        return (<Withdrawn message={p.attrs.withdrawn_message} />)
      case "embargoed":
        return (<Embargoed date={p.attrs.embargo_date}
                           pub_web_loc={p.attrs.pub_web_loc}
                           formatDate={p.formatDate}          />)
    }
  }

  renderHtml = p => { return (
      <details className="c-togglecontent" open>
        <summary>Main Content</summary>
        <ArbitraryHTMLComp html={p.content_html} h1Level={2}/>
        <br/><br/>
      </details>
  )}

}

class Withdrawn extends React.Component {
  render() {
    return (
      <div>
        <p><br/></p>
        <div className="o-itemunavailable__withdrawn">
        {this.props.message ? 
          <p className="o-itemunavailable__lede">{this.props.message}</p>
          :
          <p className="o-itemunavailable__lede">This item has been withdrawn and is <strong>no longer available</strong>.</p>
        }
        </div>
      </div>
    )
  }
}

class Embargoed extends React.Component {
  render() {
    let eDate_formatted = this.props.formatDate(this.props.date)
    return (
      <details className="c-togglecontent" open>
        <summary>Main Content</summary>
        <div className="o-itemunavailable__embargoed">
          <h3 className="o-itemunavailable__lede">This item is under embargo until
            <strong> {eDate_formatted}</strong>.</h3>
        {(this.props.pub_web_loc && this.props.pub_web_loc.length > 0) &&
          [<p key="0">You may have access to the publisher's version here:</p>,
          <a key="1" href={this.props.pub_web_loc[0]} className="o-textlink__secondary">{this.props.pub_web_loc[0]}</a>,
          <a key="2" href="" className="o-textlink__secondary">Notify me by email when this item becomes available</a>]}
        </div>
      </details>
    )
  }
}

class NoContent extends React.Component {
  handleClick(e, tabName) {
    e.preventDefault()
    this.props.changeTab(tabName)
  }

  render() {
    return (
      <div>
      {this.props.pub_web_loc && this.props.pub_web_loc.length > 0 && 
        <ViewExternalComp pub_web_loc={this.props.pub_web_loc[0]} /> }
      {this.props.supp_files && this.props.supp_files.length > 0 &&
        <div style={{paddingLeft: '25px'}}>
          <br/><br/>
          All content for this item is under the <Link to="#" onClick={(e)=>this.handleClick(e, "supplemental")} className="o-textlink__secondary">Supplemental Material</Link> tab.
        </div>
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
                         pdf_url={p.pdf_url}
                         supp_files={p.attrs.supp_files}
                         buy_link={p.attrs.buy_link}
                         download_restricted={p.download_restricted} />
        <h2 className="c-tabcontent__main-heading" tabIndex="-1"><ArbitraryHTMLComp html={p.title}/></h2>
        <AuthorListComp pubdate={p.pub_date}
                        authors={p.authors}
                        changeTab={p.changeTab} />
        <PubLocationComp pub_web_loc={p.attrs.pub_web_loc}
                         rights={p.rights} />
        <PubDataComp content_type={p.content_type} />
        {this.props.attrs.abstract && (this.props.status != "withdrawn") &&
          [<ScrollingAnchorComp key="0" name="article_abstract" />,
           <Abstract key="1" status={p.status}
                             abstract={p.attrs.abstract}
                             unit={p.unit} />] }
        <ScrollingAnchorComp name="article_main" />
        <MainContent {...p} />
      </div>
    )
  }
}

module.exports = TabMainComp;
