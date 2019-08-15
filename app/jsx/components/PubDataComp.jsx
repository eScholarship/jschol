// ##### Published Data Component ##### //

import React from 'react'
import PropTypes from 'prop-types'

class PubDataComp extends React.Component {
  static propTypes = {
    content_type: PropTypes.string,
    data_avail_stmnt: PropTypes.shape({
      type: PropTypes.string,
      url: PropTypes.string,
      contact: PropTypes.string,
      reason: PropTypes.string,
    })
  }

  render() {
    let default_stmnt = <span>No data is associated with this publication.</span>
    let stmnt = (this.props.content_type) ? <span>&nbsp;</span> : default_stmnt 
    let getStmnt = h => {     // Mimicked from splashGen.rb:getDataAvail()
      let v = {
        'publicRepo':       <span>The data associated with this publication are available at: &nbsp;
                              <a className="o-textlink__secondary" href={h["url"]}>{h["url"]}</a></span>,
        'publicRepoLater':  <span>Associated data will be made available after this publication is published.</span>,
        'suppFiles':        <span>The data associated with this publication are in the supplemental files.</span>,
        'withinManuscript': <span>The data associated with this publication are within the manuscript.</span>,
        'onRequest':        <span>The data associated with this publication are available upon request.</span>,
        'thirdParty':       <span>The data associated with this publication are managed by: &nbsp;
                              <a className="o-textlink__secondary" href={h["contact"]}>{h["contact"]}</a></span>,
        'notAvail':         <span>The data associated with this publication are not available for this reason: {h["reason"]}</span>,
        'default':          default_stmnt 
      }
      return h["type"] ? v[h["type"]] : v[h["default"]]
    }
    if (this.props.data_avail_stmnt) {
      stmnt = getStmnt(this.props.data_avail_stmnt)
    }
    return (
      <div className="c-pubdata">{stmnt}</div>
    )
  }
}

export default PubDataComp;
