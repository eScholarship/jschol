// ##### Sidebar Navigation Component ##### //

import React from 'react'

class SidebarNavComp extends React.Component {
  render() {
		return (
			<nav className="c-sidebarnav">
				<ul>
					<li><a href="">About eScholarship</a></li>
					<li><a href="">About California Digital Library</a></li>
					<li><a href="">eScholarship Staff</a></li>
					<li><a href="">Campus Contacts</a></li>
					<li><a href="">eScholarship Technology</a></li>
					<li><a href="">Featured Announcements </a></li>
					<li><a href="">In the Press</a></li>
					<li><a href="">Press Releases</a></li>
					<li><a href="">Testimonials</a></li>
					<li><a href="">OA Policy Information</a></li>
					<li><a href="">Privacy Policy</a></li>
					<li><a href="">Recently Added Publications</a></li>
					<li><a href="">Trending Publications</a></li>
				</ul>
			</nav>
		)
	}
}

module.exports = SidebarNavComp;
