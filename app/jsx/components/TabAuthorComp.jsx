// ##### Tab Author & Article Component ##### //
//
import React from 'react'
import { Link } from 'react-router'

class CitationComp extends React.Component {
  render() {
    return (
      <dl className="c-descriptionlist">
        {/* ToDo: Bring in all citations styles */}
        <dt><strong>APA</strong></dt>
        <dd>Citation here</dd>
      </dl>
    )
  }
}

class TabAuthorComp extends React.Component {
  render() {
    let issn = null
    let p = this.props
    let authorList = p.authors.map(function(a, i) {return (
          // ToDo: Link to author 
          [<dt key={i}><a href={"/search/?q="+a.name}>{a.name}</a></dt>,
           <dd key={i+1}>{a.institution ? a.institution : ""}
            {a.email ? <span>&nbsp;&nbsp;&nbsp;{a.email}</span> : ""}</dd>]
        )})
    if (p.attrs['ext_journal']) {
      issn = p.attrs['ext_journal'] && p.attrs['ext_journal']['issn']
    } 
    let peer_reviewed = p.attrs['is_peer_reviewed'] ? "True" : "False",
        permalink = "https://escholarship.org/uc/item/" + p.id,
        ezid = "https://ezid.cdlib.org/id/ark:/13030/qt" + p.id,
        appearsIn = p.appearsIn.map(function(node, i) {
          return ( <span key={i}><Link to={"/uc/"+node.id} className="o-textlink__secondary">{node.name}</Link><br/></span> )
        }),
        retrieved_suffix = ''
    if (p.attrs['orig_citation']) {
      let url = window.location.href.split('#')[0],
          date = p.formatDate(),
          r = "Retrieved " + date + ", from " 
      retrieved_suffix = <span>{r}<Link to="url">{url}</Link></span>
    }
    return(
      <div className="c-tabcontent">
      {!p.attrs['orig_citation'] &&
        <div className="c-itemactions">
        {/* ToDo: Link up citation 
          <div className="o-download">
            <a href="" className="o-download__button" download="">Download Citation</a>
            <details className="o-download__formats">
              <summary aria-label="formats"></summary>
              <ul className="o-download__single-menu">
                <li><NotYetLink element="a">RIS</NotYetLink></li>
                <li><NotYetLink element="a">BibTex</NotYetLink></li>
                <li><NotYetLink element="a">EndNote</NotYetLink></li>
                <li><NotYetLink element="a">RefWorks</NotYetLink></li>
              </ul>
            </details>
          </div> */}
        </div>
      }
        <h1 className="c-tabcontent__main-heading" tabIndex="-1">Author & Article Info</h1>
      {p.authors.length > 0 &&
        <details className="c-togglecontent" open>
          <summary>Author(s)</summary>
          <dl className="c-descriptionlist">
            {authorList}
          </dl>
        </details>
      }
      {/* ToDo:
        <details className="c-togglecontent" open>
          <summary>Citation</summary>
        {p.attrs['orig_citation'] ?
          <dl className="c-descriptionlist">
            <dt></dt><dd>{p.attrs['orig_citation']}&nbsp;&nbsp;{retrieved_suffix}</dd>
          </dl>
          :
          <CitationComp />
        }
        </details>
      */}
        <details className="c-togglecontent" open>
          <summary>Other information</summary>
          <dl className="c-descriptionlist">
          {issn && 
            [<dt key="0"><strong>ISSN</strong></dt>,
             <dd key="1">{issn}</dd>]
          }
          {p.campusID && 
            [<dt key="0"><strong>Campus</strong></dt>,
             <dd key="1"><Link to={"/uc/" + p.campusID}>{p.campusID}</Link></dd>]
          }
            <dt><strong>Peer-Reviewed</strong></dt>
            <dd>{peer_reviewed}</dd>
        {/* <dt><strong>License</strong></dt>
            <dd>**************** TBD **************</dd>  */}
            <dt><strong>Permalink</strong></dt>
            <dd><a href={permalink} className="o-textlink__secondary">{permalink}</a></dd>
            <dt><strong>EZID Label Name</strong></dt>
            <dd><a href={ezid} className="o-textlink__secondary">{ezid}</a></dd>
        {/* <dt><strong>Dash Label Name</strong></dt>
            <dd>**************** TBD **************</dd>  */}
            <dt><strong>Appears in</strong></dt>
            <dd>{appearsIn}</dd>
          </dl>
        </details>
      </div>
    )
  }
}

module.exports = TabAuthorComp;
