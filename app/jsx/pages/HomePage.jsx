// ##### Home ##### //

import React from 'react'

import { HeaderComp, GlobalNavComp, FooterComp } from '../components/AllComponents.jsx'

class Home extends React.Component {
  render = ()=>
    <div>
      <HeaderComp />
      <GlobalNavComp />
      <h2 style={{"margin-top": "10em", "margin-bottom": "10em"}}>Home page content here</h2>
      <FooterComp />
    </div>
}

module.exports = Home;
