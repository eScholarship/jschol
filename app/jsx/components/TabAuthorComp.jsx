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
    let p = this.props
    let authorList = p.authors.map(function(a, i) {return (
          // ToDo: Link to author 
          [<dt key={i}><a href={"/search/?q="+a.name}>{a.name}</a></dt>,
           <dd key={i+1}>{a.institution ? a.institution : ""}
            {a.email ? <span>&nbsp;&nbsp;&nbsp;{a.email}</span> : ""}</dd>]
        )})
    let issn = p.attrs['ext_journal'] && p.attrs['ext_journal']['issn']
    let permalink = "https://escholarship.org/uc/item/" + p.id
    let appearsIn = p.appearsIn.map(function(node, i) {
      return ( <span key={i}><Link to={"/uc/"+node.id} className="o-textlink__secondary">{node.name}</Link><br/></span> )
    })
    let doi = p.attrs['doi'] && p.attrs['doi'].startsWith("http") ?
          p.attrs['doi'] : "https://doi.org/" + p.attrs['doi']
    let retrieved_suffix = ''
    if (p.attrs['orig_citation']) {
      let url = window.location.href.split('#')[0],
          date = p.formatDate(),
          r = "Retrieved " + date + ", from " 
      retrieved_suffix = <span>{r}<Link to="url">{url}</Link></span>
    }
    let local_id_array = []
    let getLocalId = h => {
      let v = {
        'arXiv':        "arXiv ID:",
        'lbnl':         "LBNL ID:",
        'merritt':      "Merritt ID:",
        'oa_harvester': "UCPMS ID:",
        'other':        "",
        'pmid':         "Pubmed ID:",
        'pmcid':        "PubMed Central ID:",
        'proquest':     "ProQuest ID:",
        'repec':        "RePEc ID:",
        'default':      ""
      }
      return h["type"] ? v[h["type"]] : v[h["default"]]
    }
    if (p.attrs['local_ids']) {
    }
    let local_ids = local_id_array.map(function(node, i) {
      return ( <span key={i}><Link to={"/uc/"+node.id} className="o-textlink__secondary">{node.name}</Link><br/></span> )
    })
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
          {p.attrs['is_peer_reviewed'] && 
            [<dt key="0"><strong>Peer-Reviewed</strong></dt>,<br key="1" />]
          }
          {p.attrs['isbn'] && 
            [<dt key="0"><strong>ISBN:</strong></dt>,
             <dd key="1">{p.attrs['isbn']}</dd>]
          }

          {/* Journal Issue */}

          {issn && 
            [<dt key="0"><strong>ISSN:</strong></dt>,
             <dd key="1">{issn}</dd>]
          }

          {/* Publication Date */}
 

            <dt><strong>************ Series/Journal **************:</strong></dt>
            <dd>{appearsIn}</dd>

            <dt><strong>Permalink:</strong></dt>
            <dd><a href={permalink} className="o-textlink__secondary">{permalink}</a></dd>

          {doi &&
            [<dt key="0"><strong>DOI:</strong></dt>,
             <dd key="1"><a href={doi} className="o-textlink__secondary">{doi}</a></dd>]
          }

          {p.attrs['addl_info'] &&
            [<dt key="0"><strong>Additional Info</strong></dt>,
             <dd key="1">{p.attrs['addl_info']}</dd>]
          }


          {/* Local identifiers
          {p.attrs['local_ids'] &&
            [<dt key="0"><strong>Local Identifier(s):</strong></dt>,
             <dd key="1">{p.attrs['local_ids'][0]}</dd>]
          }  */}

          </dl>
        </details>
      </div>
    )
  }
}

module.exports = TabAuthorComp;
