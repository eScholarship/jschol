// ##### Media File Video Object ##### //

import React from 'react'
import $ from 'jquery'
import MediaModalComp from '../components/MediaModalComp.jsx'
import MediaFeatureVideoObj from '../objects/MediaFeatureVideoObj.jsx'

class MediaFileVideoObj extends React.Component {
  state={showModal: false}

  handleOpenModal = () => this.setState({ showModal: true });

  handleCloseModal = () => this.setState({ showModal: false });

  componentDidMount() {
    $('.o-mediafile__heading, .o-mediafile__description').dotdotdot({watch: 'window'});
  }
  render() {
    return (
      <div className="o-mediafile--video">
        <h2 className="o-mediafile__heading">
          New Horizons Kuiper Belt Fly-through
        </h2>
        <div className="o-mediafile__preview" href="images/sample_video.mp4" onClick={this.handleOpenModal}>
          {/* No preview image for this type. To add, use:
          <img src="[image path]" alt="[alt text]" /> */}
        </div>
        <div className="o-mediafile__description">
          Veritatis veniam quidem voluptatem laborum necessitatibus iure facilis laudantium possimus sequi libero aliquid, adipisci explicabo, itaque odit ut delectus nemo quas, quia neque. Error cum porro pariatur vel ducimus aliquid quo adipisci.
        </div>
        <button className="o-mediafile__view" onClick={this.handleOpenModal}><span>View Media</span></button>
        <a href="" className="o-mediafile__download" download>Download</a>
        <MediaModalComp showModal={this.state.showModal} handleCloseModal={this.handleCloseModal}>
          <MediaFeatureVideoObj />
        </MediaModalComp>
      </div>
    )
  }
}

module.exports = MediaFileVideoObj;
