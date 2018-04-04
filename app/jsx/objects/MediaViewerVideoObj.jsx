// ##### Media Viewer Video Object ##### //

import React from 'react'
import $ from 'jquery'

class MediaViewerVideoObj extends React.Component {
  componentDidMount() {
    $('.o-mediafile__heading, .o-mediafile__description').dotdotdot({watch: 'window'});
  }
  render() {
    return (
      <div className={this.props.isSelected ? "o-mediafile--video--selected" : "o-mediafile--video"}>
        <h2 className="o-mediafile__heading">
          New Horizons Kuiper Belt Fly-through
        </h2>
        <div className="o-mediafile__preview" href="images/sample_video.mp4" onClick={this.props.openViewer}>
          {/* To add preview image, use:
          <img src="[image path]" alt="[alt text]" /> */}
        </div>
        <div className="o-mediafile__description">
          Veritatis veniam quidem voluptatem laborum necessitatibus iure facilis laudantium possimus sequi libero aliquid, adipisci explicabo, itaque odit ut delectus nemo quas, quia neque. Error cum porro pariatur vel ducimus aliquid quo adipisci.
        </div>
        <button className="o-mediafile__view" onClick={this.props.openViewer}><span>View Media</span></button>
        <a href="" className="o-mediafile__download" download>Download</a>
      </div>
    )
  }
}

module.exports = MediaViewerVideoObj;
