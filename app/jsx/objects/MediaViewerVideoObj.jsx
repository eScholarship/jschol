// ##### Media Viewer Video Object ##### //

import React from 'react'

class MediaViewerVideoObj extends React.Component {
  render() {
    return (
      <div className={this.props.isSelected ? "o-mediafile--video--selected" : "o-mediafile--video"}>
        <h2 className="o-mediafile__heading u-truncate-lines">
          Sample Video
        </h2>
        <div className="o-mediafile__preview" href="images/sample_video.mp4" onClick={this.props.openViewer}>
          {/* To add preview image, use:
          <img src="[image path]" alt="[alt text]" /> */}
        </div>
        <div className="o-mediafile__description u-truncate-lines">
          This is a sample video that demonstrates the media viewer functionality for video files.
        </div>
        <button className="o-mediafile__view" onClick={this.props.openViewer}><span>View Media</span></button>
        <a href="" className="o-mediafile__download" download>Download</a>
      </div>
    )
  }
}

export default MediaViewerVideoObj;
