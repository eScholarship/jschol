// ##### Publication Information Component ##### //

import React from 'react'
import RightsComp from '../components/RightsComp.jsx'
import PropTypes from 'prop-types'

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
    let default_stmnt = <div className="c-pubinfo__statement">No data is associated with this publication.</div>
    let stmnt = (!this.props.content_type) ? default_stmnt : null 
    let getStmnt = h => {     // Mimicked from splashGen.rb:getDataAvail()
      let v = {
        'publicRepo':      [<div key="0" className="c-pubinfo__statement">
                              The data associated with this publication are available at:</div>,
                            <a key="1" className="c-pubinfo__link" href={h["url"]}>{h["url"]}</a>],
        'publicRepoLater':  <div className="c-pubinfo__statement">
                              Associated data will be made available after this publication is published</div>,
        'suppFiles':        <div className="c-pubinfo__statement">
                              The data associated with this publication are in the supplemental files.</div>,
        'withinManuscript': <div className="c-pubinfo__statement">
                              The data associated with this publication are within the manuscript.</div>,
        'onRequest':        <div className="c-pubinfo__statement">
                              The data associated with this publication are available upon request.</div>,
        'thirdParty':       [<div key="0" className="c-pubinfo__statement">
                              The data associated with this publication are managed by:</div>,
                              <a className="c-pubinfo__link" href={h["contact"]}>{h["contact"]}</a>],
        'notAvail':         <div className="c-pubinfo__statement">
                              The data associated with this publication are not available for this reason: {h["reason"]}</div>,
        'default':          default_stmnt 
      }
      return h["type"] ? v[h["type"]] : v[h["default"]]
    }
    if (this.props.data_avail_stmnt) {
      stmnt = getStmnt(this.props.data_avail_stmnt)
    }
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

module.exports = PubInfoComp;
