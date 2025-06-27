// ##### Publication Information Component ##### //

import React from 'react'
import RightsComp from '../components/RightsComp.jsx'
import PropTypes from 'prop-types'

const default_statement = "No data is associated with this publication."
class PubInfoComp extends React.Component {
  static propTypes = {
    doi: PropTypes.string,
    pub_web_loc: PropTypes.any,
    content_type: PropTypes.string,
    data_avail_stmnt: PropTypes.shape({
      type: PropTypes.string,
      url: PropTypes.string,
      contact: PropTypes.string,
      reason: PropTypes.string,
    }),
    rights: PropTypes.string,
  }

  // helper to parse URLs (comma/semicolon separated)
  parseUrls = str => {
    if (!str) return []
    // splits on commas/semicolons, removes whitespace, and filters out falsy values 
    return str
      .split(/[;,]/)
      .map(s => s.replace(/\s+/g, '').trim())
      .filter(Boolean)
  }

  renderStatement = (text, content) => {
    return (
      <>
        <div className="c-pubinfo__statement"><b>{text}</b></div>
        {Array.isArray(content) ? (
          content.length > 0 && content.map(url => (
            <a key={url} className="c-pubinfo__link" href={url}>
              {url}
            </a>
          ))
        ) : (
          content && <span>{content}</span>
        )}
      </>
    )
  }  

  getStatement = h => {
    if (!h || !h.type) return this.renderStatement(default_statement)
  
    // these are always urls, so just pass them along to be parsed 
    const urlList = this.parseUrls(h.url)
    
    // contact can be either a url or entity name (e.g. California Air Resources Board, US EPA, etc.)
    let contactOutput
    if (h.contact) {
      const contactStr = h.contact.trim()
      contactOutput = contactStr.startsWith('http') 
        ? this.parseUrls(contactStr)
        : contactStr // in the case of a name, just render the raw string 
    }

    const statements = {
      publicRepo: this.renderStatement(
        "The data associated with this publication are available at:",
        urlList
      ),
      publicRepoLater: this.renderStatement(
        "Associated data will be made available after this publication is published."
      ),
      suppFiles: this.renderStatement(
        "The data associated with this publication are in the supplemental files."
      ),
      withinManuscript: this.renderStatement(
        "The data associated with this publication are within the manuscript."
      ),
      onRequest: this.renderStatement(
        "The data associated with this publication are available upon request."
      ),
      thirdParty: this.renderStatement(
        "The data associated with this publication are managed by:",
        contactOutput
      ),
      notAvail: this.renderStatement(
        `The data associated with this publication are not available for this reason: ${h.reason}`
      ),
    }
  
    return statements[h.type] || this.renderStatement(default_statement)
  }

  render() {
    let p = this.props
    // ################# Variables for pub_web_loc ########################
    // Display DOI or pub_web_loc. If both DOI and pub_web_loc provided, display pub_web_loc
    let doi
    if (p.doi) { doi = p.doi.startsWith("http") ? p.doi : "https://doi.org/" + p.doi }
    let pub_loc_block = (p.pub_web_loc && p.pub_web_loc.length > 0) ?
        p.pub_web_loc.map(function(url, i) {
          return ( <a key={i} className="c-pubinfo__link" href={url}>{url}</a> )
        })
      :
      doi ?
        <a href={doi} className="c-pubinfo__link">{doi}</a>
        : null

    // ################# Variables for data_avail_stmnt ########################
    const stmnt = this.props.data_avail_stmnt
      ? this.getStatement(this.props.data_avail_stmnt)
      : (!this.props.content_type && this.renderStatement(default_statement))
    
    return (
      <div className="c-pubinfo">
        {/* all elements below are optional */}
      {pub_loc_block &&
        <h2 className="c-pubinfo__location-heading">Published Web Location</h2>
      }
        {pub_loc_block}
        {stmnt}
      {this.props.rights &&
        <RightsComp rights={this.props.rights} size="large" classname="c-pubinfo__license" />
      }
      </div>
    )
  }
}

export default PubInfoComp;
