// ##### Subheader 1 Component ##### //

import React from 'react'
import Header1Comp from '../components/Header1Comp.jsx'
import NavComp from '../components/NavComp.jsx'

class Subheader1Comp extends React.Component {
  render() {
    return (
      <div className="c-subheader1">
        <div className="c-subheader1__header">
          <Header1Comp />
        </div>
        <div className="c-subheader1__nav">
          <NavComp data={this.props.navdata} />
        </div>
        <div className="c-subheader1__button">
          <button className="o-button__3">Get Started</button>
        </div>
      </div>
    )
  }
}

module.exports = Subheader1Comp;
