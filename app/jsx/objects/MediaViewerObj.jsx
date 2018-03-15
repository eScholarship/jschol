// ##### Media Viewer Object ##### //
// # Combines functionality of all the individual Media Viewer Objects   //
// #  that were created by Joel: (Audio, Data, Image, Video)         //

import React from 'react'
import $ from 'jquery'
import PropTypes from 'prop-types'

class MediaViewerObj extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    mimeSimple: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    file: PropTypes.string.isRequired,
    description: PropTypes.string,
    content_prefix: PropTypes.string.isRequired,
    isSelected: PropTypes.bool.isRequired,
    openViewer: PropTypes.any.isRequired,
  }

  componentDidMount() {
    $('.o-mediafile__heading, .o-mediafile__description').dotdotdot({watch: 'window'});
  }

  render() {
    let p = this.props,
        url = p.content_prefix + "/content/qt" + p.id + "/supp/" + p.file,
        mimeSimple = (p.mimeSimple=="doc") ? "data" : p.mimeSimple,
        m = { "audio": "play audio file", "image": "view larger", "video": "play video file" },
        fileLabel = m[mimeSimple] ? m[mimeSimple] : p.file 
    return (
      <div className={this.props.isSelected ? "o-mediafile--"+this.props.type+"--selected" : "o-mediafile--"+this.props.type}>
        <h2 className="o-mediafile__heading">{this.props.title}</h2>
      {this.props.type == "image" ?
        <div className="o-mediafile__preview" href={url} onClick={p.openViewer}>
          <img src={this.props.url} alt={this.props.title}/>
        </div>
        :
        <div className="o-mediafile__preview" href={url} aria-label={fileLabel} onClick={p.openViewer}></div>
      }
        <div className="o-mediafile__description">{p.description}</div>
        <button className="o-mediafile__view" onClick={p.openViewer}><span>View Media</span></button>
        <a href={url} className="o-mediafile__download" download={p.file}>Download</a>
      </div>
    )
  }
}

module.exports = MediaViewerObj;
