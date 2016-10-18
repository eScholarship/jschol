// ##### Informational Pages Component ##### //

import React from 'react'

class InfoPagesComp extends React.Component {
  render() {
		return (
			<div className="c-infopages">
				<div className="c-infopages__item">
					<h2 className="c-infopages__heading">
						<a href="">The Center for Environmental Design Research <span className="c-infopages__heading-title">In the Press</span>
						</a>
					</h2>
					<p>The University of California awards contract to Symplectic for the implementation of a publication harvesting system to support UC’s Open Access Policy" March, 2014
					</p>
				</div>
				<div className="c-infopages__item">
					<h2 className="c-infopages__heading">
						<a href="">eScholarship <span className="c-infopages__heading-title">Content on this Site: Frequently Asked Questions</span>
						</a>
					</h2>
					<p>eScholarship provides open access, scholarly publishing services to the University of California and delivers a dynamic research platform to scholars worldwide. Learn more about the digital publishing services provided by&hellip;
					</p>
				</div>
				<div className="c-infopages__item">
					<h2 className="c-infopages__heading">
						<a href="">UC Berkeley <span className="c-infopages__heading-title">Content on this Site: Frequently Asked Questions</span>
						</a>
					</h2>
					<p>eScholarship provides open access, scholarly publishing services to the University of California and delivers a dynamic research platform to scholars worldwide. Learn more about the digital publishing services provided by eScholarship&hellip;
					</p>
				</div>
			</div>
		)
	}
}

module.exports = InfoPagesComp;
