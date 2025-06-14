// ##### Tab Main Content Component ##### //

import React from 'react'
import PdfViewComp from '../components/PdfViewComp.jsx'
import PdfViewWrapper from '../components/PdfViewWrapper.jsx'
import MediaViewerComp from '../components/MediaViewerComp.jsx'
import ViewExternalComp from '../components/ViewExternalComp.jsx'
import { Link } from 'react-router-dom'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import ScrollingAnchorComp from "../components/ScrollingAnchorComp.jsx"
import OABanner from '../components/OABanner.jsx'
class Abstract extends React.Component {

  render() {
    return (
      <details className="c-togglecontent" open>
        <summary>Abstract</summary>
        <div id="abstract-text">
          <ArbitraryHTMLComp html={this.props.abstract} p_wrap={true} h1Level={3}/>
        </div>
        <OABanner unit={this.props.unit} />
      </details>
    )
  }
}

class MainContent extends React.Component {
  render() {
    let p = this.props
    switch(p.status) {
      // Empty items are published but with no content: no published web loc, no supp files.
      // Could use the <Withdrawn> class here but using <NoContent> for semantic reasons
      case "empty":
        return (<NoContent/>)
      case "published":
      case "pending":
        if (!p.content_type) {
          if (p.attrs.pub_web_loc && p.attrs.pub_web_loc.length > 0) {
            return (<NoContent pub_web_loc={p.attrs.pub_web_loc} supp_files={p.attrs.supp_files} changeTab={p.changeTab} />)
          } else if (p.attrs.supp_files && p.attrs.supp_files.length > 0) {
            return (
              <details className="c-togglecontent" open>
                <summary>Main Content</summary>
                <MediaViewerComp id={this.props.id} supp_files={this.props.attrs.supp_files} preview_key={this.props.preview_key}/>
              </details>
            )
          } else {
            return (<Withdrawn message="This item is not available from eScholarship." />)
          }
        } else {    // JumpComp ("Jump To" menu) only present in this case
          return (p.content_type == "application/pdf" ?
                    <PdfViewWrapper 
                      url={p.pdf_url}
                      content_key={p.content_key}
                      download_restricted={p.download_restricted}
                      commenting_ok={p.commenting_ok}
                      preview_key={p.preview_key}
                      pageNum={p.pageNum}
                      onItemClick={p.onItemClick} 
                    />
                  : p.content_type == "text/html" ? this.renderHtml(p)
                  : raise("unknown content_type '" + p.content_type + "'"))
        }
      case "withdrawn":
      case "withdrawn-junk":
        return (<Withdrawn message={p.attrs.withdrawn_message} />)
      case "embargoed":
        return (<Embargoed date={p.attrs.embargo_date}
                           pub_web_loc={p.attrs.pub_web_loc}
                           formatDate={p.formatDate}          />)
      default:
        throw "unknown status '" + p.status + "'"
    }
  }

  renderHtml = p => { return (
      <details className="c-togglecontent" open>
        {/* ScrollingAnchor sits here and not above because c-togglecontent styling relies on
            coming right after it's sibling of the same class name */}
        <ScrollingAnchorComp name="article_main" />
        <summary>Main Content</summary>
        <ArbitraryHTMLComp html={p.content_html} h1Level={3}/>
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
      {!this.props.pub_web_loc && !this.props.supp_files &&
        <div style={{paddingLeft: '25px'}}>
          <br/><br/>
          The text for this item is currently unavailable.
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
    const { attrs, status, unit } = this.props
    
    return (
      <div className="c-tabcontent">
        {attrs.abstract && !/withdrawn/.test(status) && (
          <>
            <ScrollingAnchorComp name="article_abstract" />
            <Abstract 
              status={status}
              abstract={attrs.abstract}
              unit={unit} 
            />
          </>
        )}
        {/* render the banner if there's no abstract, but the pub is still apart of the OA policy series */}
        {(!attrs.abstract && unit) && <OABanner unit={unit} />}
        <MainContent {...this.props} />
      </div>
    )
  }
}

export default TabMainComp;
