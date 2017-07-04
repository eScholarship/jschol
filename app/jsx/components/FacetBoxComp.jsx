// ##### Facet Box Component ##### //

import React from 'react'

class FacetBoxComp extends React.Component {
  render() {
    return (
      <details open className="c-facetbox">
        <summary className="c-facetbox__summary"><span>Refine By</span></summary>
        <div>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias error sit possimus ducimus pariatur, repellat facere quod beatae eaque saepe eos tenetur nulla excepturi culpa aspernatur, quisquam adipisci dolore officia.</div>
        <button className="c-facetbox__show-more">Show more</button>
      </details>
    )
  }
}

module.exports = FacetBoxComp;
