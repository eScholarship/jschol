// ##### Publication Preview Component ##### //

import React from 'react'
import PubComp from '../components/PubComp.jsx'

class PubPreviewComp extends React.Component {
  render() {
    return (
      <div className="c-pubpreview">
        <a className="c-pubpreview__img" href="">
          <img src="http://placehold.it/150x200?text=Image" alt="" />
        </a>
        <PubComp />
      </div>
    )
  }
}

module.exports = PubPreviewComp;
