// ##### Footer Component ##### //

import React from 'react'
import LazyImageComp from '../components/LazyImageComp.jsx'
import { Link } from 'react-router'
import { Subscriber } from 'react-broadcast'
import MEDIA_PATH from '../../js/MediaPath.js'

class FooterComp extends React.Component {
  render() {
    return (
      <footer className="c-footer">
        <nav className="c-footer__nav">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/aboutEschol">About eScholarship</Link></li>
            <li><Link to="/campuses">Campus Sites</Link></li>
            <li><Link to="/ucoapolicies">UC Open Access Policy</Link></li>
            <li><Link to="/publishing">eScholarship Publishing</Link></li>
            <li><Link to="/privacypolicy">Privacy Statement</Link></li>
            <li><Link to="/policies">Site Policies</Link></li>
            <li><Link to="/terms">Terms of Use</Link></li>
            <Subscriber channel="cms">
              { cms => cms.loggedIn ?
                <li><Link to="/logout" onClick={()=>setTimeout(()=>cms.onLogout(), 0)}><strong>Admin Logout</strong></Link></li>
              : <li><Link to="/login"><strong>Admin Login</strong></Link></li> }
            </Subscriber>
            <li><a href="https://help.escholarship.org"><strong>Help</strong></a></li>
          </ul>
        </nav>
        <div className="c-footer__logo">
          <Link to="/"><LazyImageComp src={MEDIA_PATH + 'logo_footer-eschol.svg'} alt="eScholarship, University of California" /></Link>
        </div>
        <div className="c-footer__icons">
          <a href="https://www.facebook.com/eScholarship/">
            <LazyImageComp src={MEDIA_PATH + 'logo_facebook-circle-white.svg'} alt="Facebook"/>
          </a>
          <a href="https://twitter.com/escholarship">
            <LazyImageComp src={MEDIA_PATH + 'logo_twitter-circle-white.svg'} alt="Twitter"/>
          </a>
        </div>
        <div className="c-footer__copyright">
          Powered by the<br/>
          <a href="http://www.cdlib.org">California Digital Library</a><br/>
          Copyright &copy; 2017<br/>
          The Regents of the University of California
        </div>
      </footer>
    )
  }
}

module.exports = FooterComp;
