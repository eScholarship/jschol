// ##### Search Object ##### //

import React from 'react'
import Form from 'react-router-form'

class ObjSearch extends React.Component {
  render() {
		return (
			<Form to='/search' method="GET" className="o-search">
				<div className="o-search__form">
					<label className="o-search__label" htmlFor="global-search">Search eScholarship</label>
					<input type="search" id="global-search" name="q" className="o-search__field" placeholder="Search eScholarship"/>
					<button type="submit" className="o-search__submit-button">Search</button>
					<button className="o-search__search-close-button" aria-label="close search navigation" onClick = {()=>this.props.onClose()}></button>
				</div>
				<div className="o-search__refine">
					<input type="radio" name="search-refine" id="o-search__refine-campus"/>
					<label htmlFor="o-search__refine-campus">This campus</label>
					<input type="radio" name="search-refine" id="o-search__refine-eschol"/>
					<label htmlFor="o-search__refine-eschol">eScholarship</label>
				</div>
			</Form>
		)
	}
}

module.exports = ObjSearch;
