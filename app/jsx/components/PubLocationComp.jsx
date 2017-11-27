// ##### Published Location Component ##### //

import React from 'react'
import RightsComp from '../components/RightsComp.jsx'

class PubLocationComp extends React.Component {
  // Display DOI or pub_web_loc. If both DOI and pub_web_loc provided, display pub_web_loc
  render() {
    let doi
    if (this.props.doi) { doi = this.props.doi.startsWith("http") ? this.props.doi : "https://doi.org/" + this.props.doi }
    let pub_loc_block = (this.props.pub_web_loc && this.props.pub_web_loc.length > 0) ?
        this.props.pub_web_loc.map(function(url, i) {
          return ( <a key={i} className="c-publocation__link" href={url}>{url}</a> )
        })
      :
      doi ?
        <a href={doi} className="c-publocation__link">{doi}</a>
        : null
    return (
      <div className="c-publocation">
        {pub_loc_block &&
          <div className="c-publocation__heading">
            <h2>Published Web Location</h2>
          </div>
        }
        {pub_loc_block}
        <RightsComp rights={this.props.rights} size="large" />
      </div>
    )
  }
}

module.exports = PubLocationComp;
