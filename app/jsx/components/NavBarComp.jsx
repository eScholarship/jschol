// ##### Nav Bar Component ##### //
// this.props = {navBar: {}, }

import React from 'react'
import LanguageComp from '../components/LanguageComp.jsx'
import NavComp from '../components/NavComp.jsx'
import SocialIconsComp from '../components/SocialIconsComp.jsx'

class NavBarComp extends React.Component {
  render() {
    return (
      <div className="c-navbar">
        <NavComp data={this.props.navBar} unitId={this.props.unitId} />
        <SocialIconsComp />
        <LanguageComp />
      </div>
    )
  }
}

module.exports = NavBarComp;