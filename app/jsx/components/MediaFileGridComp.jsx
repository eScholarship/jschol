// ##### Media File Grid Component ##### //

import React from 'react'
import $ from 'jquery'

class MediaFileGridComp extends React.Component {
  componentDidMount() {
    $('.o-mediafile__heading, .o-mediafile__description').dotdotdot({watch: 'window'});
  }
  render() {
    return (
      <div className="c-mediafilegrid">
        {/* Media File Component #1 */}
        <div className="o-mediafile--audio">
          <h2 className="o-mediafile__heading">
            <a href="">Outer Space Music</a>
          </h2>
          <a className="o-mediafile__link" href="/images/sample_audio.mp3" aria-label="play audio file">
            {/* image with o-media__image doesn't extist */}
          </a>
          <button className="o-mediafile__button">Download</button>
          <div className="o-mediafile__description">
            Architecto quo praesentium, suscipit, qui est maxime ut repellendus earum odio ab, consequuntur saepe voluptatem commodi dolorum eos adipisci, fugiat tempore ipsa. Reprehenderit corrupti quae ea, veritatis iste, perspiciatis. Ad, reiciendis praesentium!
          </div>
        </div>
        {/* Media File Component #2 */}
        <div className="o-mediafile--data">
          <h2 className="o-mediafile__heading">
            <a href="">New Horizons File Archive</a>
          </h2>
          <a className="o-mediafile__link" href="/images/sample_audio.mp3">
            {/* image with o-media__image doesn't extist */}
          </a>
          <button className="o-mediafile__button">Download</button>
          <div className="o-mediafile__description">
            Eaque, qui rerum fugiat sed. Error aperiam quo atque debitis doloremque. Adipisci, ab placeat! Atque vitae blanditiis, fuga necessitatibus harum libero, repudiandae quasi vero repellendus fugiat asperiores placeat tempore qui vel iusto!
          </div>
        </div>
        {/* Media File Component #3 */}
        <div className="o-mediafile--image">
          <h2 className="o-mediafile__heading">
            <a href="">New Horizons Full Trajectory - Side View</a>
          </h2>
          <a className="o-mediafile__link" href="/images/temp_new-horizons-data.png">
            <img className="o-mediafile__image" src="/images/temp_new-horizons-data.png" alt="New horizons data" />
          </a>
          <button className="o-mediafile__button">Download</button>
          <div className="o-mediafile__description">
            Esse nulla ad veritatis dolorum, vitae maxime tenetur nemo. Quod eius corrupti provident nisi ullam, repellendus molestias, aliquam neque nulla dolorem, magnam commodi ratione enim ex, suscipit labore veniam deserunt nam exercitationem!
          </div>
        </div>
        {/* Media File Component #4 */}
        <div className="o-mediafile--video--selected">
          <h2 className="o-mediafile__heading">
            <a href="">New Horizons Kuiper Belt Fly-through</a>
          </h2>
          <a className="o-mediafile__link" href="/images/sample_video.mp4" aria-label="play video file">
            <img className="o-mediafile__image" src="/images/sample_video-poster.jpg" alt="New horizons data" />
          </a>
          <button className="o-mediafile__button">Download</button>
          <div className="o-mediafile__description">
            Veritatis veniam quidem voluptatem laborum necessitatibus iure facilis laudantium possimus sequi libero aliquid, adipisci explicabo, itaque odit ut delectus nemo quas, quia neque. Error cum porro pariatur vel ducimus aliquid quo adipisci.
          </div>
        </div>
      </div>
    )
  }
}

module.exports = MediaFileGridComp;
