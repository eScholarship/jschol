// ##### Media Viewer Data Object ##### //

import React from 'react'
import $ from 'jquery'

class MediaViewerDataObj extends React.Component {
  componentDidMount() {
    $('.o-mediafile__heading, .o-mediafile__description').dotdotdot({watch: 'window'});
  }
  render() {
    return (
      <div className={this.props.isSelected ? "o-mediafile--data--selected" : "o-mediafile--data"}>
        <h2 className="o-mediafile__heading">
          New Horizons File Archive
        </h2>
        <div className="o-mediafile__preview" href="images/sample_audio.mp3" onClick={this.props.openViewer}>
          {/* To add preview image, use:
          <img src="[image path]" alt="[alt text]" /> */}
        </div>
        <div className="o-mediafile__description">
          Eaque, qui rerum fugiat sed. Error aperiam quo atque debitis doloremque. Adipisci, ab placeat! Atque vitae blanditiis, fuga necessitatibus harum libero, repudiandae quasi vero repellendus fugiat asperiores placeat tempore qui vel iusto!
        </div>
        <button className="o-mediafile__view" onClick={this.props.openViewer}><span>View Media</span></button>
        <a href="" className="o-mediafile__download" download>Download</a>
      </div>
    )
  }
}

module.exports = MediaViewerDataObj;
