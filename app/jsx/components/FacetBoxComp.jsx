// ##### Facet Box Component ##### //

import React from 'react'

// When running in the browser (and only then), include polyfill(s)
if (!(typeof document === "undefined")) {
  require('details-polyfill')
}

class FacetBoxComp extends React.Component {
  render() {
		return (
			<details className="c-facetbox">
				<summary className="c-facetbox__summary">Refine By</summary>
				<div>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias error sit possimus ducimus pariatur, repellat facere quod beatae eaque saepe eos tenetur nulla excepturi culpa aspernatur, quisquam adipisci dolore officia.</div>
			</details>
		)
	}
}

module.exports = FacetBoxComp;
