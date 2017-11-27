// ##### Tab Author & Article Component ##### //
//
import React from 'react'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
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
  // ToDo: Maybe componentize this as similar logic is also being used in JournalLayout
  customIssueTitle = (vol, iss, numbering, issue_title) => {
    if (vol == "0" && iss == "0") {
      return issue_title 
    }
    else {
      let voliss
      if (!numbering) {
        voliss = iss ? vol + "(" + iss + ")" : vol
      } else if (numbering === "volume_only") {
        voliss = "Volume " + vol 
      } else {
        voliss = iss 
      }
      return voliss 
    }
  }

  render() {
    let p = this.props
    let authorList = p.authors.map(function(a, i) {return (
          // ToDo: Link to author 
          [<dt key={i}><a href={"/search/?q="+a.name}>{a.name}</a></dt>,
           <dd key={i+1}>{a.institution ? a.institution : ""}</dd>]
        )})

    // Journal info
    // Uhh, borrowing from header > breadcrumb data object here even though we're not in the header
    let lastCrumb = (p.header && p.header.breadcrumb) ? p.header.breadcrumb[p.header.breadcrumb.length-1] : null
    let [journal_name, volume, issue, issue_url] = [null, null, null, null]
    if (p.attrs['ext_journal']) {
      let extj = p.attrs['ext_journal']
      journal_name = extj['name'] 
      volume = extj['volume']
      issue = extj['issue'] 
    } else if (p.citation) {
      let c = p.citation 
      // 'journal_name' defined by 'appears_in' value below
      volume = c['volume'] ? c['volume'] : ''
      issue = c['issue'] 
      issue_url = lastCrumb ? lastCrumb.url : null 
    }
    let issue_title = lastCrumb ? lastCrumb.name : null
    let journal_stmnt
    if (journal_name || volume || issue) {
      let voliss = this.customIssueTitle(volume, issue, p.numbering, issue_title) 
      journal_stmnt = journal_name ? journal_name+", "+voliss : voliss
    }

    let issn = p.attrs['ext_journal'] && p.attrs['ext_journal']['issn']

    let unit_type
    if (p.unit) { unit_type = p.unit.type == 'journal' ? "Journal" : "Series" }

    let permalink = "https://escholarship.org/uc/item/" + p.id
    let appearsIn = p.appearsIn.map(function(node, i) {
      return ( <span key={i}><Link to={"/uc/"+node.id} className="o-textlink__secondary">{node.name}</Link><br/></span> )
    })

    let doi
    if (p.attrs['doi']) { doi = p.attrs['doi'].startsWith("http") ? p.attrs['doi'] : "https://doi.org/" + p.attrs['doi'] }

    let retrieved_suffix = ''
    if (p.attrs['orig_citation']) {
      let url = window.location.href.split('#')[0],
          date = p.formatDate(),
          r = "Retrieved " + date + ", from " 
      retrieved_suffix = <span>{r}<Link to="url">{url}</Link></span>
    }

    // Local ID looks something like this:
    //   [{"id": "Southern_ucsc_0036E_11162", "type": "proquest"}, {"id": "http://dissertations.umi.com/ucsc:11162", "type": "other"}, {"id": "ark:/13030/m5dn8t2h", "type": "merritt"}] 
    let localIdLabel = type => {
      let v = {
        'arXiv':        "arXiv ID: ",
        'lbnl':         "LBNL Report #: ",
        'merritt':      "Merritt ID: ",
        'oa_harvester': "UCPMS ID: ",
        'other':        "",
        'pmid':         "Pubmed ID: ",
        'pmcid':        "PubMed Central ID: ",
        'proquest':     "ProQuest ID: ",
        'repec':        "RePEc ID: ",
        'default':      ""
      }
      return type ? v[type] : v["default"]
    }
    let local_ids
    if (p.attrs['local_ids']) {
      local_ids = p.attrs['local_ids'].map(function(node, i) {
        let label = localIdLabel(node.type)
        if (node.id.startsWith("http")) {
          return ( <span key={i}><a href={node.id} className="o-textlink__secondary">{label}{node.id}</a><br/></span> )
        } else {
          return ( <span key={i}>{label}{node.id}<br/></span> )
        }
      })
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
          {p.attrs['is_peer_reviewed'] && 
            [<dt key="0"><strong>Peer-Reviewed</strong></dt>,<br key="1" />]
          }
          {p.attrs['isbn'] && 
            [<dt key="0"><strong>ISBN:</strong></dt>,
             <dd key="1">{p.attrs['isbn']}</dd>]
          }

          {issn && 
            [<dt key="0"><strong>ISSN:</strong></dt>,
             <dd key="1">{issn}</dd>]
          }

          {p.pub_date && 
            [<dt key="0"><strong>Publication Date:</strong></dt>,
             <dd key="1">{p.pub_date}</dd>]
          }
 
          {unit_type &&
            [<dt key="0"><strong>{unit_type}:</strong></dt>,
             <dd key="1">{appearsIn}</dd>]
          }

          {journal_stmnt && 
            [<dt key="0"><strong>Journal Issue:</strong></dt>,
             <dd key="1">
             {issue_url ?
               <Link to={issue_url} className="o-textlink__secondary">{journal_stmnt}</Link>
              :
               <span>{journal_stmnt}</span>
             }
             </dd>]
          }

            <dt><strong>Permalink:</strong></dt>
            <dd><a href={permalink} className="o-textlink__secondary">{permalink}</a></dd>

          {doi &&
            [<dt key="0"><strong>DOI:</strong></dt>,
             <dd key="1"><a href={doi} className="o-textlink__secondary">{doi}</a></dd>]
          }

          {p.attrs['addl_info'] &&
            [<dt key="0"><strong>Additional Info</strong></dt>,
             <dd key="1"><ArbitraryHTMLComp html={p.attrs['addl_info']} h1Level={2}/></dd>]
          }


          {local_ids &&
            [<dt key="0"><strong>Local Identifier(s):</strong></dt>,
             <dd key="1">{local_ids}</dd>]
          }

          </dl>
        </details>
      </div>
    )
  }
}

module.exports = TabAuthorComp;
