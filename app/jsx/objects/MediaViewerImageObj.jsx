// ##### Media Viewer Image Object ##### //

import React from 'react'

class MediaViewerImageObj extends React.Component {
  render() {
    return (
      <div className={this.props.isSelected ? "o-mediafile--image--selected" : "o-mediafile--image"}>
        <h2 className="o-mediafile__heading u-truncate-lines">
          Sample Image
        </h2>
        <div className="o-mediafile__preview" href="images/sample_image.jpg" onClick={this.props.openViewer}>
          <img src="images/sample_image.jpg" alt="Sample Image" />
        </div>
        <div className="o-mediafile__description u-truncate-lines">
          This is a sample image that demonstrates the media viewer functionality for image files.
        </div>
        <button className="o-mediafile__view" onClick={this.props.openViewer}><span>View Media</span></button>
        <a href="" className="o-mediafile__download" download>Download</a>
      </div>
    )
  }
}

export default MediaViewerImageObj;
