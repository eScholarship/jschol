// ##### Footer Component ##### //

import React from 'react'

class FooterComp extends React.Component {
  render() {
    return (
      <div className="c-footer">
        <nav className="c-footer__nav">
          <a href="">Home</a>
          <a href="">About eScholarship</a>
          <a href="">Campuses</a>
          <a href="">OA Policies</a>
          <a href="">Journals</a>
          <a href="">Deposit</a>
          <a href="">Privacy Policy</a>
          <a href="">Terms & Conditions</a>
          <a href="">Help</a>
          <a href="">Admin Login</a>
        </nav>
        <div className="c-footer__logo">
          <a href="">
            <img src="/images/logo_temp-footer-eschol.png" alt="eScholarship logo"/>
          </a>
        </div>
        <div className="c-footer__icons">
          <a href="">
            <img src="/images/logo_facebook.svg" alt="Facebook"/>
          </a>
          <a href="">
            <img src="/images/logo_twitter.svg" alt="Twitter"/>
          </a>
        </div>
        <div className="c-footer__copyright">
          Powered by the<br/>
          <a href="http://www.cdlib.org">California Digital Library</a>.<br/>
          Copyright &copy; 2017<br/>
          The Regents of the University of California.
        </div>
      </div>
    )
  }
}

module.exports = FooterComp;
