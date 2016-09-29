// ##### Search Component ##### //

import React from 'react'

class SearchComp extends React.Component {
  render() {
		return (
			<form action="" className="c-search">
				<div className="c-search__form">
					<label className="c-search__label" htmlFor="global-search">Search eScholarship</label>
					<input type="search" id="global-search" className="c-search__field" placeholder="Search eScholarship"/>
					<button type="submit" className="c-search__submit-button">Search</button>
					<button className="c-search__search-close-button" aria-label="close search navigation" onClick = {()=>this.props.onClose()}></button>
				</div>
				<div className="c-search__refine">
					<input type="radio" name="search-refine" id="c-search__refine-campus"/>
					<label htmlFor="c-search__refine-campus">This campus</label>
					<input type="radio" name="search-refine" id="c-search__refine-eschol"/>
					<label htmlFor="c-search__refine-eschol">eScholarship</label>
				</div>
			</form>
		)
	}
}

module.exports = SearchComp;
