// ##### Journal Objects ##### //

import React from 'react'

class JournalObj extends React.Component {
  render() {
    return (
      <div>
        
        <h2>Featured Journal</h2>
        <a href="" className="o-journal1">
          <figure>
            <img src="http://via.placeholder.com/300x300?text=Image" alt=""/>
            <figcaption>Chicana-Latina Law Review</figcaption>
          </figure>
        </a>

        <h2>Journal Item</h2>
        <a href="" className="o-journal2">
          <figure>
            <img src="http://via.placeholder.com/300x300?text=Image" alt=""/>
            <figcaption className="u-truncate-lines">The Proceedings of the UCLA Department of Spanish and Portuguese Graduate Conference</figcaption>
          </figure>
        </a>

      </div>
    )
  }
}

export default JournalObj;
