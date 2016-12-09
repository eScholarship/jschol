// ##### Footer Component ##### //

import React from 'react'

class FooterComp extends React.Component {
  render() {
		return (
			<div className="c-footer">
				<div className="c-footer__logologin">
					<div className="c-footer__logo">
						<a href="">
							<img src="/images/logo_temp-footer-cdl.png" alt="California Digital Library logo"/>
						</a>
					</div>
						<a href="">
							<div className="c-footer__login">
								Account login
							</div>
						</a>
				</div>
				<nav className="c-footer__nav">
					<a href="">Home</a>
					<a href="">Campuses</a>
					<a href="">OA Policies</a>
					<a href="">Journals</a>
					<a href="">About eScholarship</a>
					<a href="">Deposit</a>
					<a href="">Help</a>
					<a href="">Contact Us</a>
					<a href="">Privacy Policy</a>
					<a href="">Terms & Conditions</a>
				</nav>
				<div className="c-footer__social-icons">
					<a href="">
						<img src="/images/logo_temp-facebook.png" alt="Facebook"/>
					</a>
					<a href="">
						<img src="/images/logo_temp-twitter.png" alt="Twitter"/>
					</a>
					<a href="">
						<img src="/images/logo_temp-google.png" alt="Google"/>
					</a>
					<a href="">
						<img src="/images/logo_temp-m.png" alt="M"/>
					</a>
				</div>
				<div className="c-footer__copyright">
					Powered by the <a href="">California Digital Library</a>.<br/>Copyright &copy; 2016 The Regents of the University of California.
				</div>
			</div>
		)
	}
}

module.exports = FooterComp;
