// ##### Media List Component ##### //

import React from 'react'

class MediaListComp extends React.Component {
  render() {
    return (
      <ul className="c-medialist">
        <li className="c-medialist__image">Contains 2 supplemental images</li>
        <li className="c-medialist__pdf">Contains 2 supplemental PDFs</li>
        <li className="c-medialist__audio">Contains 5 supplemental audio files</li>
        <li className="c-medialist__video">Contains 5 supplemental videos</li>
        <li className="c-medialist__zip">Contains 4 supplemental <abbr title="zips">ZIPs</abbr></li>
        <li className="c-medialist__other">Contains 3 supplemental files</li>
      </ul>
    )
  }
}

module.exports = MediaListComp;
