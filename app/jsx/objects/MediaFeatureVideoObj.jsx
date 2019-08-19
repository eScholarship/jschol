// ##### Media Feature Video Object ##### //

import React from 'react'
import MEDIA_PATH from '../../js/MediaPath.js'

class MediaFeatureVideoObj extends React.Component {
  render() {
    return (
      <div className="o-mediafeature--video">
        <h2>New Horizons Kuiper Belt Fly-Through</h2>
        <div className="o-mediafeature__item">
          <video src={MEDIA_PATH + 'sample_video.mp4'} poster={MEDIA_PATH + 'sample_video-poster.jpg'} controls></video>
        </div>
        <div className="o-mediafeature__description">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facilis optio numquam aut facere odio et accusantium eius quo harum, quis ab molestias illum totam earum nemo voluptatum eligendi nobis. Molestiae reprehenderit et neque nisi nam corporis totam exercitationem, numquam fuga. Sint minima quisquam, velit quod ratione. Vero, libero, accusantium. Rem.
        </div>
      </div>
    )
  }
}

export default MediaFeatureVideoObj;
