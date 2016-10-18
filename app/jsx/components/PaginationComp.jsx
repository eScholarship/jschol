// ##### Pagination Component ##### //

import React from 'react'

class PaginationComp extends React.Component {
  render() {
		return (
			<div className="c-pagination" action="">
				<a className="c-pagination__prevnext" href="">Previous</a>
				<a className="c-pagination__item--active" href="">1</a>
				<a className="c-pagination__item" href="">2</a>
				<a className="c-pagination__item" href="">3</a>
				<span className="c-pagination__ellipses">&hellip;</span>
				<a className="c-pagination__item" href="">342</a>
				<a className="c-pagination__prevnext" href="">Next</a>
			</div>
		)
	}
}

module.exports = PaginationComp;
