// ##### Nav Bar Component ##### //
// this.props = {navBar: {}, unit: {}, socialProps: {}}

import React from 'react'
import LanguageComp from '../components/LanguageComp.jsx'
import NavComp from '../components/NavComp.jsx'
import SocialIconsComp from '../components/SocialIconsComp.jsx'

class NavBarComp extends React.Component {
  static propTypes = {
    navBar: React.PropTypes.arrayOf(React.PropTypes.shape({
      name: React.PropTypes.string.isRequired,

      slug: React.PropTypes.string,
      url: React.PropTypes.string,
      file: React.PropTypes.file,
      sub_nav: React.PropTypes.array      // Array Of the same things included in navBar
    })),
    socialProps: React.PropTypes.shape({
      facebook: React.PropTypes.string,
      twitter: React.PropTypes.string,
      rss: React.PropTypes.string
    }),
    unit: React.PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      name: React.PropTypes.string.isRequired,
      type: React.PropTypes.string.isRequired,
      extent: React.PropTypes.object
    }).isRequired,
  }

  render() {
    return (
      <div className="c-navbar">
        {this.props.navBar && <NavComp data={this.props.navBar} unitId={this.props.unit.id} />}
        {this.props.socialProps && <SocialIconsComp 
            facebook={this.props.socialProps.facebook} 
            twitter={this.props.socialProps.twitter} 
            rss={this.props.socialProps.rss} />}
        {this.props.languages && <LanguageComp />}
      </div>
    )
  }
}

module.exports = NavBarComp;