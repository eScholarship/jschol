// ##### Export/RSS Component ##### //

import React from 'react'

class ExportComp extends React.Component {
  render() {
    return (
      <div className="c-export">
        <button className="o-button__5 c-export__export-button">Export</button>
        <button className="o-button__5 c-export__rss-button">RSS</button>
      </div>
    )
  }
}

module.exports = ExportComp;
