// ##### Search Object ##### //

import React from 'react'

class ObjBox extends React.Component {
  render() {
		return (
			<div>
				<h2>Main Column Box</h2>
				<div className="o-columnbox-main">
					<h2 className="o-columnbox-main__heading">About eScholarship</h2>
					<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias sed sapiente nulla debitis nobis asperiores hic est, fuga illo? Accusamus molestias pariatur nihil, libero possimus optio iusto nobis sapiente ad.
					</p>
				</div>
				<h2>Sidebar Column Box</h2>
				<div className="o-columnbox-sidebar">
					<h2 className="o-columnbox-sidebar__heading">Placeholder Title</h2>
					<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Alias sed sapiente nulla debitis nobis asperiores hic est, fuga illo? Accusamus molestias pariatur nihil, libero possimus optio iusto nobis sapiente ad.
					</p>
				</div>
			</div>
			
		)
	}
}

module.exports = ObjBox;
