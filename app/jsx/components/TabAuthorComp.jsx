// ##### Tab Author & Article Component ##### //
//
import React from 'react'
import ArbitraryHTMLComp from "../components/ArbitraryHTMLComp.jsx"
import { Link } from 'react-router-dom'

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

  addDot(str) {
    str = str.trim()
    return /[.?]$/.test(str) ? str + " " : str + ". "
  }

  localIdLabel(type) {
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
      'report':       "Report #: ",
      'default':      ""
    }
    return v[type] ? v[type] : v["default"]
  }

  formatAuth(auth) {
    let out
    if (auth.lname) {
      out = auth.lname
      if (auth.fname) {
        if (/^[A-Z]{2,3}/.test(auth.fname)) // already a set of initials
          out += ", " + auth.fname
        else {
          out += ", " + auth.fname.substr(0,1).toLocaleUpperCase() + "."
          if (auth.mname)
            out += " " + auth.mname.substr(0,1).toLocaleUpperCase()
        }
      }
    }
    else if (auth.organization)
      out = auth.organization
    else
      out = auth.name
    return out
  }

  formatDoi(doi) {
    if (/^10\./.test(doi))
      return "http://dx.doi.org/" + doi
    else
      return "doi:" + doi
  }

  formatCitation(props) {
    let out = ""
    try {
      // First comes the list of authors. According to APA spec, if there 8 or more
      // we list the first 6 and then "et al."
      let auths = props.authors
      if (auths && auths.length > 0) {
        if (auths.length == 1)
          out += this.formatAuth(auths[0])
        else if (auths.length < 8) {
          out += _.map(auths.slice(0, auths.length-1), this.formatAuth).join(", ")
          out += ", & " + this.formatAuth(auths[auths.length-1])
        }
        else
          out += _.map(auths.slice(0,6), this.formatAuth).join("; ") + ", et al."
        out = this.addDot(out)
      }

      // Next comes the publication year in parens, followed by a dot.
      let match = /^(\d\d\d\d)/.exec(props.published)
      if (match)
        out += "(" + match[1] + "). "

      // Next comes the title, followed by a dot. APA says to italicize book titles only.
      out += props.genre == "monograph" ? "<em>"+props.title+"</em>" : props.title
      out = this.addDot(out)

      // If it's a book chapter, note the book it's in. Likewise, if it's a monograph
      // in a monograph series.
      if (props.attrs.book_title) {
        out = this.addDot(out + "In <em>" + props.attrs.book_title + "</em>")
        if (props.attrs.publisher)
          out = this.addDot(out + "Location: " + props.attrs.publisher)
      }
      else if (props.unit && props.unit.type == "monograph_series" && props.attrs.publisher)
        out = this.addDot(out + "Location: " + props.attrs.publisher)
      else if (props.unit && props.unit.type == "series" && props.attrs.publisher)
        out = this.addDot(out + "<em>" + props.attrs.publisher + "</em>")

      // Include journal info
      let ext = props.attrs.ext_journal
      if (ext && ext.name) {
        // External journals
        out += "<em>" + ext.name + "</em>, "
        if (ext.volume) {
          out += ext.volume
          if (ext.issue)
            out += "(" + ext.issue + ")"
        }
        else if (ext.issue)
          out += ext.issue
        if (ext.fpage) {
          out += ", " + ext.fpage
          if (ext.lpage)
            out += "-" + ext.lpage
        }
        out = this.addDot(out)
      }
      else if (props.unit.type == "journal" && props.citation) {
        // Internal (escholarship) journals
        out += "<em>" + props.unit.name + "</em>"
        let voliss = ""
        if (props.numbering == "issue_only")
          voliss += props.citation.issue
        else if (props.citation.volume && props.citation.volume != "0") { // skip articles-in-press
          voliss += props.citation.volume
          if (props.numbering != "volume_only" && props.citation.issue && props.citation.issue != "0")
            voliss += "(" + props.citation.issue + ")"
        }
        if (voliss != "")
          out += ", " + voliss
        out = this.addDot(out)
      }

      else if (props.unit && props.unit.type == "series" && props.attrs.publisher) {
        // when series name has been added
        out += props.header.campusName
        if (props.unit && props.unit.name) {
          let dept = props.unit.type == "oru" ? props.unit.name : props.header.ancestorName
          if (dept != props.header.campusName) {
            if (dept.startsWith(props.header.campusName))
              dept = dept.substr(props.header.campusName.length)
            out += ": " + dept.trim()
          }
        }
        out = this.addDot(out)
      }
      else if (props.header.campusName && props.genre != "monograph" && props.genre != "journal" && !props.attrs.book_title) {
        // General series
        out += "<em>" + props.header.campusName
        if (props.unit && props.unit.name) {
          let dept = props.unit.type == "oru" ? props.unit.name : props.header.ancestorName
          if (dept != props.header.campusName) {
            if (dept.startsWith(props.header.campusName))
              dept = dept.substr(props.header.campusName.length)
            out += ": " + dept.trim()
          }
        }
        out += "</em>"
        out = this.addDot(out)
      }

      // Include certain local IDs
      if (props.attrs['local_ids']) {
        _.each(props.attrs['local_ids'], node => {
          let label = this.localIdLabel(node.type)
          if (label != "" && node.type != "oa_harvester")
            out = this.addDot(out + label + node.id)
        })
      }

      // If there's a DOI, include it in canonical format.
      if (props.attrs.doi)
        out += this.formatDoi(props.attrs.doi) + " "

      // Last is the URL
      let url = window.location.href.split('#')[0]
      out += "Retrieved from " + url
    }
    catch (err) {
      console.log("Warning: Exception occurred in citation processing:", err)
      return ""
    }
    return out
  }

  contribList(contribs) {
    return contribs.map((a, i) => {
      let orcid = a.ORCID_id ? "https://orcid.org/" + a.ORCID_id : null
      return (
        [<dt key={i}><a href={"/search/?q="+encodeURIComponent("author:"+a.name)}>{a.name}</a></dt>,
         <dd key={i+1}>{a.institution ? a.institution : a.department ? a.department : ""}
           &nbsp;&nbsp;{orcid ? <a className="o-textlink__secondary" href={orcid}>{orcid}</a> : ""}
         </dd>]
    )})
  }

  render() {
    let p = this.props
    let authorList = p.attrs['author_hide'] ? null : this.contribList(p.authors)
    let editorList = p.editors ? this.contribList(p.editors) : null
    let advisorList = p.advisors ? this.contribList(p.advisors) : null
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

    // Local ID looks something like this:
    //   [{"id": "Southern_ucsc_0036E_11162", "type": "proquest"}, {"id": "http://dissertations.umi.com/ucsc:11162", "type": "other"}, {"id": "ark:/13030/m5dn8t2h", "type": "merritt"}] 
    let local_ids
    if (p.attrs['local_ids']) {
      local_ids = p.attrs['local_ids'].map((node, i) => {
        let label = this.localIdLabel(node.type)
        if (node.id.startsWith("http")) {
          return ( <span key={i}><a href={node.id} className="o-textlink__secondary">{label}{node.id}</a><br/></span> )
        } else {
          return ( <span key={i}>{label}{node.id}<br/></span> )
        }
      })
    }
    let kind = p.genre == "monograph" ? "Book" : "Article"
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
        <h1 className="c-tabcontent__main-heading" tabIndex="-1">Author & {kind} Info</h1>

        <details className="c-togglecontent" open>
          <summary>Author(s)</summary>
          {(p.attrs['author_hide'] || p.authors.length == 0) ?
            <dl className="c-descriptionlist">No author information available</dl>
          : <dl className="c-descriptionlist">{authorList}</dl> }
        </details> 

      {editorList &&
        <details className="c-togglecontent" open>
          <summary>Editor(s)</summary>
          <dl className="c-descriptionlist">{editorList}</dl>
        </details>
      }

      {advisorList &&
        <details className="c-togglecontent" open>
          <summary>Advisor(s)</summary>
          <dl className="c-descriptionlist">{advisorList}</dl>
        </details>
      }

        <details className="c-togglecontent" open>
          <summary>Citation</summary>

          <dl className="c-descriptionlist">
            {p.attrs['custom_citation'] &&
                [<dt key="dt-custom">Preferred:</dt>,
                <dd key="dd-custom"><ArbitraryHTMLComp html={p.attrs['custom_citation']}/></dd>]
            }

            <dt key="dt-apa">Suggested:</dt>
            <dd key="dd-apa">
              <ArbitraryHTMLComp html={this.formatCitation(p)}/>
            </dd>

            {p.attrs['orig_citation'] &&
                [<dt key="dt-orig">Original:</dt>,
                 <dd key="dd-orig">{p.attrs['orig_citation']}</dd>]
            }
          </dl>
        </details>

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
          {/* display published date where OASPA is not enabled */} 
	  {p.published && (!p.attrs['pub_publish'] || p.show_pub_dates != "true")  &&
            [<dt key="0"><strong>Publication Date:</strong></dt>,
             <dd key="1">{p.published}</dd>]
          }
	  {/* display dates for OASPA enabled journals */}
          {p.show_pub_dates == "true" && p.attrs['pub_publish'] &&
            [<dt key="0"><strong>Publication Date:</strong></dt>,
             <dd key="1">{p.attrs['pub_publish']}</dd>]
          }

          {p.show_pub_dates == "true" && p.attrs['pub_accept'] &&
            [<dt key="0"><strong>Acceptance Date:</strong></dt>,
             <dd key="1">{p.attrs['pub_accept']}</dd>]
          }

          {p.show_pub_dates == "true" && p.attrs['pub_submit'] &&
            [<dt key="0"><strong>Submission Date:</strong></dt>,
             <dd key="1">{p.attrs['pub_submit']}</dd>]
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
            [<dt key="0"><strong>Additional Info:</strong></dt>,
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

export default TabAuthorComp;
