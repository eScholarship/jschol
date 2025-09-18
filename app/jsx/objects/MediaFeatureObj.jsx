// ##### Media Feature Object ##### //
// # Combines functionality of all the individual Media feature Objects   //
// #  that were created by Joel: (Audio, Data, Image, Video)         //

import React from 'react'
import MEDIA_PATH from '../../js/MediaPath.js'

class MediaFeatureObj extends React.Component {
  render() {
    return (
      <div className={"o-mediafeature--" + this.props.type}>
        <h2>{this.props.title}</h2>
      {(() => {
    switch(this.props.type) {
      case "image":
        return <div className="o-mediafeature__item">
                 <img src={this.props.url} alt={this.props.title}/> 
               </div>
      case "video":
        const trackFiles = this.props.trackFiles || []

        return (
          <div className="o-mediafeature__item">
            <video 
              src={this.props.url} 
              controls 
              poster={MEDIA_PATH + "logo_eschol-media-thumbnail.png"}
            > 
              {trackFiles.length > 0 && trackFiles.map((track, index) => (
                <track 
                  key={track.file}
                  kind="captions" 
                  src={track.url} 
                  srcLang="en"
                  label={`Captions ${index + 1}`}
                  default={index === 0}
                />
              ))}
            </video>
          </div>
        )
      case "audio":
        return <div className="o-mediafeature__item">
                 <audio src={this.props.url} controls></audio>
               </div>
      default:   // data
        return <div className="o-mediafeature__item">
                 <strong>No preview available</strong>
                 <a className="o-textlink__left-icon" href={this.props.url} download={this.props.file}>Download {this.props.title}</a>
               </div>
          }
      })()}
        <div className="o-mediafeature__description">{this.props.description}</div>
        <a href="{this.props.doi}" className="o-mediafeature__doi">{this.props.doi}</a>
      </div>
    )
  }
}

export default MediaFeatureObj;
