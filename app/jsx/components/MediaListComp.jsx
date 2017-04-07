// ##### Media List Component ##### //

import React from 'react'

class MediaListComp extends React.Component {
  render() {
    return (
      <ul className="c-medialist">
        <li className="c-medialist__video">Contains 5 videos</li>
        <li className="c-medialist__image">Contains 2 images</li>
        <li className="c-medialist__pdf">Contains 2 additional PDFs</li>
        <li className="c-medialist__audio">Contains 5 audio files</li>
      </ul>
    )
  }
}

module.exports = MediaListComp;
