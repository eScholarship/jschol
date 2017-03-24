// ##### Tab Supplemental Material Component ##### //

import React from 'react'
import RefineMediaComp from '../components/RefineMediaComp.jsx'
import MediaFileGridComp from '../components/MediaFileGridComp.jsx'

class TabSupplementalComp extends React.Component {
  render() {
    let supp_files = this.props.attrs.supp_files,
      mimeTypes = [] 
    if (supp_files) {  
      mimeTypes = [...new Set(supp_files.map(f => f.mimeType))];
    }
    return (
      <div className="c-tabcontent">
        <h1 className="c-tabcontent__heading" tabIndex="-1">Supplemental Material</h1>
        {supp_files ? 
          [<RefineMediaComp mimeTypes={mimeTypes} key="0" />,
          <MediaFileGridComp supp_files={supp_files} key="1" />]
          : <div>No supplemental material included with this item</div> }
      </div>
    )
  }
}

module.exports = TabSupplementalComp;
