// ##### Social Icons Component ##### //
// this.props = {facebook: '', twitter: '', rss: ''}

import React from 'react'

class SocialIconsComp extends React.Component {
  render() {
    return (
      <div className="c-socialicons">
        {this.props.facebook && 
          <a href={this.props.facebook}>
            <img src="/images/logo_facebook-black.svg" alt="Facebook"/>
          </a>
        }
        {this.props.twitter && 
          <a href={this.props.twitter}>
            <img src="/images/logo_twitter-black.svg" alt="Twitter"/>
          </a>
        }
        {this.props.rss && 
          <a href={this.props.rss}>
            <img src="/images/icon_rss-black.svg" alt="RSS"/>
          </a>
        }
      </div>
    )
  }
}

module.exports = SocialIconsComp;
