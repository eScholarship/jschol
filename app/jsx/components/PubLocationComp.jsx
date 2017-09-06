// ##### Published Location Component ##### //

import React from 'react'
import RightsComp from '../components/RightsComp.jsx'

class PubLocationComp extends React.Component {
  render() {
    let pub_loc_block = null
    if (this.props.pub_web_loc && this.props.pub_web_loc.length > 0) {
      pub_loc_block = 
        this.props.pub_web_loc.map(function(url, i) {
          return ( <a key={i} className="c-publocation__link" href={url}>{url}</a> )
        })
    }
    return (
      <div className="c-publocation">
        {pub_loc_block &&
          <div className="c-publocation__heading">
            <h2>Published Web Location</h2>
          </div>
        }
        {pub_loc_block}
        {this.props.rights && <RightsComp rights={this.props.rights} size="large" /> }
      </div>
    )
  }
}

module.exports = PubLocationComp;
