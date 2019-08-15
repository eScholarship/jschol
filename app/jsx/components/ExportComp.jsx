// ##### Export/RSS Component ##### //

import React from 'react'

class ExportComp extends React.Component {
  render() {
    return (
      <div className="c-export">
        <button className="c-export__export-button">Export</button>
        <button className="c-export__rss-button">RSS</button>
      </div>
    )
  }
}

export default ExportComp;
