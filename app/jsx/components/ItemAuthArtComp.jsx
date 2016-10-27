// ##### Item View Tab: Author and Article Info Component ##### //

import React from 'react'

class ItemAuthArtComp extends React.Component {
  render() {
    let p = this.props,
        authorList = p.authors.map(function(node, i) {
          return (
            <p key={i}>{node}</p>
          )
        }),
        issn = p.attrs['ext_journal'] && p.attrs['ext_journal']['issn'],
        peer_reviewed = p.attrs['is_peer_reviewed'] ? "True" : "False",
        permalink = "http://www.escholarship.org/item/" + p.id,
        ezid = "http://ezid.cdlib.org/id/ark:/13030/qt" + p.id
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
          **** ToDo: Placeholder for Appears in **** 
        </p>

        <p><br/><br/><br/></p>
      </div>
    )
  }
}

module.exports = ItemAuthArtComp;
