// ##### Media Feature Audio Object ##### //

import React from 'react'
import MEDIA_PATH from '../../js/MediaPath.js'

class MediaFeatureAudioObj extends React.Component {
  render() {
    return (
      <div className="o-mediafeature--audio">
        <h2>Outer Space Music</h2>
        <div className="o-mediafeature__item">
          <audio src={MEDIA_PATH + 'sample_audio.mp3'} controls></audio>
        </div>
        <div className="o-mediafeature__description">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facilis optio numquam aut facere odio et accusantium eius quo harum, quis ab molestias illum totam earum nemo voluptatum eligendi nobis. Molestiae reprehenderit et neque nisi nam corporis totam exercitationem, numquam fuga. Sint minima quisquam, velit quod ratione. Vero, libero, accusantium. Rem.
        </div>
      </div>
    )
  }
}

module.exports = MediaFeatureAudioObj;
