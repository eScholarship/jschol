// ##### Media Viewer Data Object ##### //

import React from 'react'

class MediaViewerDataObj extends React.Component {
  render() {
    return (
      <div className={this.props.isSelected ? "o-mediafile--data--selected" : "o-mediafile--data"}>
        <h2 className="o-mediafile__heading u-truncate-lines">
          Sample Data File
        </h2>
        <div className="o-mediafile__preview" href="images/sample_data.csv" onClick={this.props.openViewer}>
          {/* To add preview image, use:
          <img src="[image path]" alt="[alt text]" /> */}
        </div>
        <div className="o-mediafile__description u-truncate-lines">
          This is a sample data file that demonstrates the media viewer functionality for data files.
        </div>
        <button className="o-mediafile__view" onClick={this.props.openViewer}><span>View Media</span></button>
        <a href="" className="o-mediafile__download" download>Download</a>
      </div>
    )
  }
}

export default MediaViewerDataObj;
