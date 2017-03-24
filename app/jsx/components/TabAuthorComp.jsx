// ##### Tab Author & Article Component ##### //

import React from 'react'

class TabAuthorComp extends React.Component {
  render() {
    let p = this.props,
        authorList = p.authors.map(function(a, i) {return (
          <p key={i}>{a.name} {a.institution ? <span><br/>{a.institution}</span> : ""}</p>
        )}),
        issn = p.attrs['ext_journal'] && p.attrs['ext_journal']['issn'],
        peer_reviewed = p.attrs['is_peer_reviewed'] ? "True" : "False",
        permalink = "http://www.escholarship.org/item/" + p.id,
        ezid = "http://ezid.cdlib.org/id/ark:/13030/qt" + p.id,
        appearsIn = p.appearsIn.map(function(node, i) {
          return ( <span key={i}><a href={node.url}>{node.name}</a><br/></span> )
        })
    return(
      <div className="content">
        {p.authors.length > 0 && <div><h3>Author(s)</h3>{authorList}</div>}

        <h3>Citation</h3>
        {p.attrs['orig_citation']}

        <h3>Other Information</h3>
        {issn && <p>ISSN<br/>{issn}</p>}

        {p.campusID && <p>Campus<br/><a href={"/unit/" + p.campusID}>{p.campusID}</a></p>}

        <p>Peer-Reviewed<br/>
          {peer_reviewed}
        </p>

        <p>Permalink<br/>
          <a href={permalink}>{permalink}</a>
        </p>

        <p>EZID Label Name<br/>
          <a href={ezid}>{ezid}</a>
        </p>

        <p>Appears in<br/>
          {appearsIn}
        </p>

        <p><br/><br/><br/></p>
      </div>
    )
  }
}

module.exports = TabAuthorComp;
