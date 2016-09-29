// ##### Sort By Component ##### //

import React from 'react'

class SortComp extends React.Component {
  render() {
		return (
			<form className="c-sort">
				<div className="o-input__droplist">
					<label htmlFor="c-sort1">Sort By</label>
					<select name="" id="c-sort1">
						<option value="">Relevance</option>
						<option value="">Most Popular</option>
						<option value="">A-Z By Title</option>
						<option value="">Z-A By Title</option>
						<option value="">A-Z By Author</option>
						<option value="">Z-A By Author</option>
						<option value="">Date Ascending</option>
						<option value="">Date Decending</option>
					</select>
				</div>
				<div className="o-input__droplist c-sort__page-input">
					<label htmlFor="c-sort2">Per Page</label>
					<select name="" id="c-sort2">
						<option value="">10</option>
						<option value="">20</option>
						<option value="">30</option>
						<option value="">50</option>
						<option value="">100</option>
					</select>
				</div>
			</form>
		)
	}
}

module.exports = SortComp;
