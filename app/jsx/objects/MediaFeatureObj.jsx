// ##### Media Feature Object ##### //
// # Combines functionality of all the individual Media feature Objects   //
// #  that were created by Joel: (Audio, Data, Image, Video)         //

import React from 'react'

class MediaFeatureObj extends React.Component {
  render() {
    return (
      <div className={"o-mediafeature--" + this.props.type}>
        <h2>{this.props.title}</h2>
        <div className="o-mediafeature__item">
          {(() => {
            switch(this.props.type) {
              case "image":
                return <img src={this.props.url} alt={this.props.title}/> 
              case "video":
                return <video src={this.props.url} controls poster="/images/sample_video-poster.jpg"></video> 
              case "audio":
                return <audio src={this.props.url} controls></audio>
              default:   // data
                // ToDo: Hrrmmmmm
                // return ([<strong key="0">No preview available</strong>,
                //    <button key="1">Download {this.props.title}</button>])
                return <div>
                         <strong>No preview available</strong>
                         <a href={this.props.url} download={this.props.file}>Download {this.props.title}</a>
                       </div>
            }
          })()}
        </div>
        <div className="o-mediafeature__description">{this.props.description}</div>
      </div>
    )
  }
}

module.exports = MediaFeatureObj;
