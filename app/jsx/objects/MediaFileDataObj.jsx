// ##### Media File Data Object ##### //

import React from 'react'
import $ from 'jquery'
import MediaModalComp from '../components/MediaModalComp.jsx'
import MediaFeatureDataObj from '../objects/MediaFeatureDataObj.jsx'

class MediaFileDataObj extends React.Component {
  state={showModal: false}

  handleOpenModal = () => this.setState({ showModal: true });

  handleCloseModal = () => this.setState({ showModal: false });

  componentDidMount() {
    $('.o-mediafile__heading, .o-mediafile__description').dotdotdot({watch: 'window'});
  }
  render() {
    return (
      <div className="o-mediafile--data">
        <h2 className="o-mediafile__heading">
          New Horizons File Archive
        </h2>
        <div className="o-mediafile__preview" href="images/sample_audio.mp3" onClick={this.handleOpenModal}>
          {/* No preview image for this type. To add, use:
          <img src="[image path]" alt="[alt text]" /> */}
        </div>
        <div className="o-mediafile__description">
          Eaque, qui rerum fugiat sed. Error aperiam quo atque debitis doloremque. Adipisci, ab placeat! Atque vitae blanditiis, fuga necessitatibus harum libero, repudiandae quasi vero repellendus fugiat asperiores placeat tempore qui vel iusto!
        </div>
        <button className="o-mediafile__view" onClick={this.handleOpenModal}><span>View Media</span></button>
        <a href="" className="o-mediafile__download" download>Download</a>
        <MediaModalComp showModal={this.state.showModal} handleCloseModal={this.handleCloseModal}>
          <MediaFeatureDataObj />
        </MediaModalComp>
      </div>
    )
  }
}

module.exports = MediaFileDataObj;
