// ##### Media Feature Object ##### //
// # Combines functionality of all the individual Media feature Objects   //
// #  that were created by Joel: (Audio, Data, Image, Video)         //

import React from 'react'

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
        return <div className="o-mediafeature__item">
                 <video src={this.props.url} controls poster="/images/sample_video-poster.jpg"></video> 
               </div>
      case "audio":
        return <div className="o-mediafeature__item">
                 <audio src={this.props.url} controls></audio>
               </div>
      default:   // data
        return <div className="o-mediafeature__item">
                 <strong>No preview available</strong>
                 <a href={this.props.url} download={this.props.file}>Download {this.props.title}</a>
               </div>
          }
      })()}
        <div className="o-mediafeature__description">{this.props.description}</div>
      </div>
    )
  }
}

module.exports = MediaFeatureObj;
