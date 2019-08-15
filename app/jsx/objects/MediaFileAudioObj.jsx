// ##### Media File Audio Object ##### //

import React from 'react'
import $ from 'jquery'
import MediaModalComp from '../components/MediaModalComp.jsx'
import MediaFeatureAudioObj from '../objects/MediaFeatureAudioObj.jsx'

class MediaFileAudioObj extends React.Component {
  state={showModal: false}

  handleOpenModal = () => this.setState({ showModal: true });

  handleCloseModal = () => this.setState({ showModal: false });

  componentDidMount() {
    $('.o-mediafile__heading, .o-mediafile__description').dotdotdot({watch: 'window'});
  }
  render() {
    return (
      <div className="o-mediafile--audio">
        <h2 className="o-mediafile__heading">
          Outer Space Music
        </h2>
        <div className="o-mediafile__preview" href="images/sample_audio.mp3" onClick={this.handleOpenModal}>
          {/* No preview image for this type. To add, use:
          <img src="[image path]" alt="[alt text]" /> */}
        </div>
        <div className="o-mediafile__description">
          Architecto quo praesentium, suscipit, qui est maxime ut repellendus earum odio ab, consequuntur saepe voluptatem commodi dolorum eos adipisci, fugiat tempore ipsa. Reprehenderit corrupti quae ea, veritatis iste, perspiciatis. Ad, reiciendis praesentium!
        </div>
        <button className="o-mediafile__view" onClick={this.handleOpenModal}><span>View Media</span></button>
        <a href="" className="o-mediafile__download" download>Download</a>
        <MediaModalComp showModal={this.state.showModal} handleCloseModal={this.handleCloseModal}>
          <MediaFeatureAudioObj />
        </MediaModalComp>
      </div>
    )
  }
}

export default MediaFileAudioObj;
