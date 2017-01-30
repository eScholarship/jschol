// ##### Social Icons Component ##### //

import React from 'react'

class SocialIconsComp extends React.Component {
  render() {
    return (
      <div className="c-socialicons">
        <a href="">
          <img src="images/logo_facebook-black.svg" alt="Facebook"/>
        </a>
        <a href="">
          <img src="images/logo_twitter-black.svg" alt="Twitter"/>
        </a>
        <a href="">
          <img src="images/icon_rss-black.svg" alt="RSS"/>
        </a>
      </div>
    )
  }
}

module.exports = SocialIconsComp;
