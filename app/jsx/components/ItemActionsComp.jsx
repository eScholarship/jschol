// ##### Item Actions Component ##### //

import React from 'react'
import DownloadComp from '../components/DownloadComp.jsx'
import ShareComp from '../components/ShareComp.jsx'

class ItemActionsComp extends React.Component {
  render() {
    let download_block = null
    if (["withdrawn", "embargoed"].includes(this.props.status) ||
         !this.props.content_type) {
      download_block = <div>This item is not available for download from eScholarship</div>
    } else {
      download_block = 
        <div className="c-itemactions__items1">
          <DownloadComp />
          <button className="o-button__6">Buy in Print</button>
          <button className="o-button__6">Buy e-Book</button>
        </div>
    }
    return (
      <div className="c-itemactions">
        {download_block}
        <div className="c-itemactions__items2">
          <ShareComp type="item" id={this.props.id}/>
        </div>
      </div>
    )
  }
}

module.exports = ItemActionsComp;
