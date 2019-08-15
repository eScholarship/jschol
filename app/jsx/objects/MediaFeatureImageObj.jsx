// ##### Media Feature Image Object ##### //

import React from 'react'
import MEDIA_PATH from '../../js/MediaPath.js'

class MediaFeatureImageObj extends React.Component {
  render() {
    return (
      <div className="o-mediafeature--image">
        <h2>New Horizons Full Trajectory - Side View</h2>
        <div className="o-mediafeature__item">
          <img src={MEDIA_PATH + 'temp_new-horizons-data.png'} alt="New horizons full trajectory side view"/>
        </div>
        <div className="o-mediafeature__description">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptatibus quidem mollitia error neque debitis voluptas similique quibusdam aliquid voluptatum, numquam consectetur expedita ipsa est obcaecati omnis tenetur ea doloribus enim vero excepturi dolore earum. Nisi provident aliquid minus aperiam magnam et mollitia quidem, fugiat possimus illo quisquam aut dolorem sequi!
        </div>
      </div>
    )
  }
}

export default MediaFeatureImageObj;
