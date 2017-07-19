// ##### Publication Component ##### //

import React from 'react'
import AuthorListComp from '../components/AuthorListComp.jsx'
import MediaListComp from '../components/MediaListComp.jsx'

class PubComp extends React.Component {
  render() {
    return (
      <div className="c-pub">
      {/* To indent component, use "c-pub--intent" */}
        <h2 className="c-pub__heading">
          <a href="">From the New Heights: The City and Migrating Latinas in Real Women Have Curves and María Full of Grace</a>
        </h2>
        <AuthorListComp />
        <p>Pariatur fuga laborum, qui debitis vitae quaerat quas ab officia, dolor dignissimos ipsum nam ratione unde animi? Officiis rerum unde eveniet natus. Laboriosam tenetur vel, rem culpa maiores non, tempora voluptatibus quasi quos provident exercitationem itaque dolorum quam sequi dolor odio hic accusamus, repellendus ut dignissimos. Labore modi consectetur ullam, iste accusamus!</p>
        <MediaListComp />
      </div>
    )
  }
}

module.exports = PubComp;
