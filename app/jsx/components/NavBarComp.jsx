// ##### Nav Bar Component ##### //
// this.props = {navBar: {}, unitData: {}, socialProps: {}}

import React from 'react'
import LanguageComp from '../components/LanguageComp.jsx'
import NavComp from '../components/NavComp.jsx'
import SocialIconsComp from '../components/SocialIconsComp.jsx'

class NavBarComp extends React.Component {
  render() {
    return (
      <div className="c-navbar">
        {this.props.navBar && <NavComp data={this.props.navBar} unitId={this.props.unitData.unitId} />}
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