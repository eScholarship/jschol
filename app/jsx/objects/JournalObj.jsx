// ##### Journal Objects ##### //

import React from 'react'
import $ from 'jquery'
import dotdotdot from 'jquery.dotdotdot'

class JournalObj extends React.Component {
  componentDidMount () {
    $('.o-journal2 figcaption').dotdotdot({
      watch: 'window'
    });
  }
  render() {
    return (
      <div>
        
        <h2>Featured Journal</h2>
        <a href="" className="o-journal1">
          <figure>
            <img src="http://escholarship.org/issueCovers/uclalaw_cllr/34_01_cover.png" alt=""/>
            <figcaption>Chicana-Latina Law Review</figcaption>
          </figure>
        </a>

        <h2>Journal Item</h2>
        <a href="" className="o-journal2">
          <figure>
            <img src="http://escholarship.org/issueCovers/jmie_sfews/15_01_cover.png" alt=""/>
            <figcaption>The Proceedings of the UCLA Department of Spanish and Portuguese Graduate Conference</figcaption>
          </figure>
        </a>

      </div>
    )
  }
}

module.exports = JournalObj;
