// ##### Media File Image Object ##### //

import React from 'react'
import $ from 'jquery'

class MediaFileImageObj extends React.Component {
  componentDidMount() {
    $('.o-mediafile__heading, .o-mediafile__description').dotdotdot({watch: 'window'});
  }
  render() {
    return (
      <div className="o-mediafile--image--selected">
        <h2 className="o-mediafile__heading">
          New Horizons Full Trajectory - Side View
        </h2>
        <div className="o-mediafile__preview" href="images/temp_new-horizons-data.png">
          <img src="images/temp_new-horizons-data.png" alt="New horizons data" />
        </div>
        <div className="o-mediafile__description">
          Esse nulla ad veritatis dolorum, vitae maxime tenetur nemo. Quod eius corrupti provident nisi ullam, repellendus molestias, aliquam neque nulla dolorem, magnam commodi ratione enim ex, suscipit labore veniam deserunt nam exercitationem!
        </div>
        <button className="o-mediafile__view"><span>View Media</span></button>
        <a href="" className="o-mediafile__download" download>Download</a>
      </div>
    )
  }
}

module.exports = MediaFileImageObj;
