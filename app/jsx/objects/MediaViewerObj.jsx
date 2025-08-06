// ##### Media Viewer Object ##### //
// # Combines functionality of all the individual Media Viewer Objects   //
// #  that were created by Joel: (Audio, Data, Image, Video)         //

import React from 'react'
import PropTypes from 'prop-types'

class MediaViewerObj extends React.Component {
  static propTypes = {
    mimeSimple: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    file: PropTypes.string.isRequired,
    description: PropTypes.string,
    url: PropTypes.string.isRequired,
    isSelected: PropTypes.bool.isRequired,
    openViewer: PropTypes.any.isRequired,
  }

  render() {
    let p = this.props,
        m = { "audio": "play audio file", "image": "view larger", "video": "play video file" },
        fileLabel = m[p.mimeSimple] ? m[p.mimeSimple] : p.file 
    return (
      <div className={p.isSelected ? "o-mediafile--" + p.mimeSimple + "--selected" : "o-mediafile--" + p.mimeSimple}>
        <h2 className="o-mediafile__heading u-truncate-lines">{p.title}</h2>
      {p.mimeSimple == "image" ?
        <div className="o-mediafile__preview" href={p.url} onClick={p.openViewer}>
          <img src={p.url} alt={p.title}/>
        </div>
        :
        <div className="o-mediafile__preview" href={p.url} aria-label={fileLabel} onClick={p.openViewer}></div>
      }
        <div className="o-mediafile__description u-truncate-lines">{p.description}</div>
        <button className="o-mediafile__view" onClick={p.openViewer}><span>View Media</span></button>
        <a href={p.url} className="o-mediafile__download" download={p.file}>Download</a>
      </div>
    )
  }
}

export default MediaViewerObj;
