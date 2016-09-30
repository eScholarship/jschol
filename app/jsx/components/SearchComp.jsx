// ##### Search Component ##### //

import React from 'react'
import Form from 'react-router-form'

class SearchComp extends React.Component {
  render() {
		return (
			<Form to='/search' method="GET" className="c-search">
				<div className="c-search__form">
					<label className="c-search__label" htmlFor="global-search">Search eScholarship</label>
					<input type="search" id="global-search" name="q" className="c-search__field" placeholder="Search eScholarship"/>
					<button type="submit" className="c-search__submit-button">Search</button>
					<button className="c-search__search-close-button" aria-label="close search navigation" onClick = {()=>this.props.onClose()}></button>
				</div>
				<div className="c-search__refine">
					<input type="radio" name="search-refine" id="c-search__refine-campus"/>
					<label htmlFor="c-search__refine-campus">This campus</label>
					<input type="radio" name="search-refine" id="c-search__refine-eschol"/>
					<label htmlFor="c-search__refine-eschol">eScholarship</label>
				</div>
			</Form>
		)
	}
}

module.exports = SearchComp;
