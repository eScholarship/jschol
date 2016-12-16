// ##### Home ##### //

import React from 'react'

import HeaderComp from '../components/HeaderComp.jsx'
import NavComp from '../components/NavComp.jsx'
import FooterComp from '../components/FooterComp.jsx'

class Home extends React.Component {
  render = ()=>
    <div>
      <HeaderComp />
      <NavComp />
      <h2 style={{ marginTop: "5em", marginBottom: "5em" }}>Home page content here</h2>
      <FooterComp />
    </div>
}

module.exports = Home;
