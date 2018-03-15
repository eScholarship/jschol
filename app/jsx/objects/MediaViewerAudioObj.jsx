// ##### Media Viewer Audio Object ##### //

import React from 'react'
import $ from 'jquery'

class MediaViewerAudioObj extends React.Component {
  componentDidMount() {
    $('.o-mediafile__heading, .o-mediafile__description').dotdotdot({watch: 'window'});
  }
  render() {
    return (
      <div className={this.props.isSelected ? "o-mediafile--audio--selected" : "o-mediafile--audio"}>
        <h2 className="o-mediafile__heading">
          Outer Space Music
        </h2>
        <div className="o-mediafile__preview" href="images/sample_audio.mp3" onClick={this.props.openViewer}>
          {/* To add preview image, use:
          <img src="[image path]" alt="[alt text]" /> */}
        </div>
        <div className="o-mediafile__description">
          Architecto quo praesentium, suscipit, qui est maxime ut repellendus earum odio ab, consequuntur saepe voluptatem commodi dolorum eos adipisci, fugiat tempore ipsa. Reprehenderit corrupti quae ea, veritatis iste, perspiciatis. Ad, reiciendis praesentium!
        </div>
        <button className="o-mediafile__view" onClick={this.props.openViewer}><span>View Media</span></button>
        <a href="" className="o-mediafile__download" download>Download</a>
      </div>
    )
  }
}

module.exports = MediaViewerAudioObj;
