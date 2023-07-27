// ##### Footer Component ##### //

import React from 'react'
import LazyImageComp from '../components/LazyImageComp.jsx'
import { Link } from 'react-router-dom'
import Contexts from '../contexts.jsx'
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
            <li><a href="https://www.cdlib.org/about/accessibility.html">Accessibility</a></li>
            <li><Link to="/privacypolicy">Privacy Statement</Link></li>
            <li><Link to="/policies">Site Policies</Link></li>
            <li><Link to="/terms">Terms of Use</Link></li>
            <Contexts.CMS.Consumer>
              { cms => cms.loggedIn ?
                <li><Link to="/logout" onClick={()=>setTimeout(()=>cms.onLogout(), 0)}><strong>Admin Logout</strong></Link></li>
              : <li><Link to="/login"><strong>Admin Login</strong></Link></li> }
            </Contexts.CMS.Consumer>
            <li><a href="https://help.escholarship.org"><strong>Help</strong></a></li>
          </ul>
        </nav>
        <div className="c-footer__logo">
          <Link to="/"><LazyImageComp src={MEDIA_PATH + 'logo_footer-eschol.svg'} alt="eScholarship, University of California" /></Link>
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

export default FooterComp;
