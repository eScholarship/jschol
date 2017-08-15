// ##### Media Feature Objects ##### //

import React from 'react'

class MediaFeatureObj extends React.Component {
  render() {
    return (
      <div>

        <h2>Audio Example</h2>
        <div className="o-mediafeature--audio">
          <h2>Outer Space Music</h2>
          <div className="o-mediafeature__item">
            <audio src="images/sample_audio.mp3" controls></audio>
          </div>
          <div className="o-mediafeature__description">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facilis optio numquam aut facere odio et accusantium eius quo harum, quis ab molestias illum totam earum nemo voluptatum eligendi nobis. Molestiae reprehenderit et neque nisi nam corporis totam exercitationem, numquam fuga. Sint minima quisquam, velit quod ratione. Vero, libero, accusantium. Rem.
          </div>
        </div>

        <h2>File Example</h2>
        <div className="o-mediafeature--file">
          <h2>New Horizons Telemetry Data</h2>
          <div className="o-mediafeature__item">
            <strong>No preview available</strong>
            <button>Download New Horizons Telemetry Data</button>
          </div>
          <div className="o-mediafeature__description">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facere neque eligendi possimus excepturi officiis at! Eaque animi quaerat unde dignissimos delectus odio soluta, illo magni et, amet nisi explicabo, ducimus numquam quam totam, optio excepturi harum! Necessitatibus soluta sit sunt exercitationem earum qui obcaecati cupiditate voluptate repellendus, officiis, nobis, error?
          </div>
        </div>

        <h2>Picture Example</h2>
        <div className="o-mediafeature--picture">
          <h2>New Horizons Full Trajectory - Side View</h2>
          <div className="o-mediafeature__item">
            <img src="images/temp_new-horizons-data.png" alt="New horizons full trajectory side view"/>
          </div>
          <div className="o-mediafeature__description">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Voluptatibus quidem mollitia error neque debitis voluptas similique quibusdam aliquid voluptatum, numquam consectetur expedita ipsa est obcaecati omnis tenetur ea doloribus enim vero excepturi dolore earum. Nisi provident aliquid minus aperiam magnam et mollitia quidem, fugiat possimus illo quisquam aut dolorem sequi!
          </div>
        </div>

        <h2>Video Example</h2>
        <div className="o-mediafeature--video">
          <h2>New Horizons Kuiper Belt Fly-Through</h2>
          <div className="o-mediafeature__item">
            <video src="images/sample_video.mp4" controls poster="images/sample_video-poster.jpg"></video>
          </div>
          <div className="o-mediafeature__description">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facilis optio numquam aut facere odio et accusantium eius quo harum, quis ab molestias illum totam earum nemo voluptatum eligendi nobis. Molestiae reprehenderit et neque nisi nam corporis totam exercitationem, numquam fuga. Sint minima quisquam, velit quod ratione. Vero, libero, accusantium. Rem.
          </div>
        </div>
        
      </div>
    )
  }
}

module.exports = MediaFeatureObj;
