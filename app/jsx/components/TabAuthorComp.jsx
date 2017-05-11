// ##### Tab Author & Article Component ##### //

import React from 'react'
import { Link } from 'react-router'

class TabAuthorComp extends React.Component {
  render() {
    let p = this.props,
        authorList = p.authors.map(function(a, i) {return (
          [<dt key={i}>{a.name}</dt>,
           <dd key={i+1}>{a.institution ? {a.institution} : ""}
            {a.email ? {a.email} : ""}</dd>]
        )}),
        issn = p.attrs['ext_journal'] && p.attrs['ext_journal']['issn'],
        peer_reviewed = p.attrs['is_peer_reviewed'] ? "True" : "False",
        permalink = "http://www.escholarship.org/item/" + p.id,
        ezid = "http://ezid.cdlib.org/id/ark:/13030/qt" + p.id,
        appearsIn = p.appearsIn.map(function(node, i) {
          return ( <span key={i}><Link to={node.url}>{node.name}</Link><br/></span> )
        })
    return(
      <div className="c-tabcontent">
        <div className="c-itemactions">
          <div className="o-download">
            <button className="o-download__button">Download Citation</button>
            <details className="o-download__formats">
              <summary aria-label="formats"></summary>
              <ul className="o-download__single-menu">
                <li><a href="">RIS</a></li>
                <li><a href="">BibTex</a></li>
                <li><a href="">EndNote</a></li>
                <li><a href="">RefWorks</a></li>
              </ul>
            </details>
          </div>
        </div>
        <h1 className="c-tabcontent__main-heading" tabIndex="-1">Author & Article Info</h1>
      {p.authors.length > 0 &&
        <details className="c-togglecontent" open>
          <summary>Author(s)</summary>
        </details>
        <dl className="c-descriptionlist">
          {authorList}
        </dl>
      }
        <details className="c-togglecontent" open>
          <summary>Citation</summary>
          <dl className="c-descriptionlist">
            {/* ToDo: Bring in all citations styles */}
            <dt><a href="">APA</a></dt>
            <dd>
              {p.attrs['orig_citation']}
            </dd>
        </details>
        <details className="c-togglecontent" open>
          <summary>Other information</summary>
          <dl className="c-descriptionlist">
          {issn && 
            <dt><a href="">ISSN</a></dt>
            <dd>{issn}</dd>
          }
          {p.campusID && 
            <dt><Link to={"/unit/" + p.campusID}>Campus</Link></dt>
            <dd>{p.campusID}</dd>
          }
            <dt><a href="">Peer-Reviewed</a></dt>
            <dd>{peer_reviewed}</dd>
            <dt><a href="">License</a></dt>
            <dd>**************** TBD **************</dd>
            <dt><a href="">Permalink</a></dt>
            <dd><Link to={permalink}>{permalink}</Link></dd>
            <dt><a href="">EZID Label Name</a></dt>
            <dd><Link to={ezid}>{ezid}</Link></dd>
            <dt><a href="">Dash Label Name</a></dt>
            <dd>**************** TBD **************</dd>
            <dt><a href="">Appears in</a></dt>
            <dd>{appearsIn}</dd>
          </dl>
        </details>
      </div>
    )
  }
}

module.exports = TabAuthorComp;
