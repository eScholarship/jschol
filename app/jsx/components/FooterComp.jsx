// ##### Footer Component ##### //

import React from 'react'
import { Link } from 'react-router'
import { Subscriber } from 'react-broadcast'

class FooterComp extends React.Component {
  render() {
    return (
      <footer className="c-footer">
        <nav className="c-footer__nav">
          <Link to="/">Home</Link>
          <Link to="/static/root/aboutEschol">About eScholarship</Link>
          <Link to="/campuses">Campuses</Link>
          <a href="">OA Policies</a>
          <Link to="/journals">Journals</Link>
          <a href="">Deposit</a>
          <a href="">Privacy Policy</a>
          <a href="">Terms & Conditions</a>
          <a href="">Help</a>
          <Subscriber channel="cms">
            { cms => cms.loggedIn ?
                  <Link to="/logout" onClick={()=>setTimeout(()=>cms.onLogout(), 0)}><strong>Admin Logout</strong></Link>
                : <Link to="/login"><strong>Admin Login</strong></Link> }
          </Subscriber>
        </nav>
        <div className="c-footer__logo">
          <a href="">
            <img src="/images/logo_footer-eschol.svg" alt="eScholarship, University of California"/>
          </a>
        </div>
        <div className="c-footer__icons">
          <a href="">
            <img src="/images/logo_facebook-circle-white.svg" alt="Facebook"/>
          </a>
          <a href="">
            <img src="/images/logo_twitter-circle-white.svg" alt="Twitter"/>
          </a>
        </div>
        <div className="c-footer__copyright">
          Powered by the<br/>
          <a href="http://www.cdlib.org">California Digital Library</a>.<br/>
          Copyright &copy; 2017<br/>
          The Regents of the University of California.
        </div>
      </footer>
    )
  }
}

module.exports = FooterComp;
