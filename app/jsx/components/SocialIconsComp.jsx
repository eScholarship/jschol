// ##### Social Icons Component ##### //
// this.props = {facebook: '', twitter: '', rss: ''}

import React from 'react'
import MEDIA_PATH from '../../js/MediaPath.js'

class SocialIconsComp extends React.Component {
  render() {
    return (
      <div className="c-socialicons">
        {this.props.facebook && 
          <a href={"http://www.facebook.com/" + this.props.facebook}>
            <img src={MEDIA_PATH + 'logo_facebook-circle-black.svg'} alt="Facebook"/>
          </a>
        }
        {this.props.twitter && 
          <a href={"http://www.twitter.com/" + this.props.twitter}>
            <img src={MEDIA_PATH + 'logo_twitter-circle-black.svg'} alt="Twitter"/>
          </a>
        }
        {this.props.rss && 
          <a href={this.props.rss}>
            <img src={MEDIA_PATH + 'logo_rss-circle-black.svg'} alt="RSS"/>
          </a>
        }
      </div>
    )
  }
}

module.exports = SocialIconsComp;
