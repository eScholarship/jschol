// ##### Nav Bar Component ##### //
// this.props = {navBar: {}, unit: {}, socialProps: {}}

import React from 'react'
import PropTypes from 'prop-types'
import LanguageComp from '../components/LanguageComp.jsx'
import NavComp from '../components/NavComp.jsx'
import SocialIconsComp from '../components/SocialIconsComp.jsx'

class NavBarComp extends React.Component {
  static propTypes = {
    navBar: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,

      slug: PropTypes.string,
      url: PropTypes.string,
      file: PropTypes.file,
      sub_nav: PropTypes.array      // Array Of the same things included in navBar
    })),
    socialProps: PropTypes.shape({
      facebook: PropTypes.string,
      twitter: PropTypes.string,
      rss: PropTypes.string
    }),
    unit: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      extent: PropTypes.object
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
