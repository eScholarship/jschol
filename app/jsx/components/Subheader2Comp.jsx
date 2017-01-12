// ##### Subheader 2 Component ##### //

import React from 'react'
import CampusSelectorComp from '../components/CampusSelectorComp.jsx'
import Nav3Comp from '../components/Nav3Comp.jsx'

class Subheader2Comp extends React.Component {
  render() {
    let p = this.props
    return (
      <div className="c-subheader">
        <div className="c-subheader__row1">
          <CampusSelectorComp campusID={p.campusID}
                              campusName={p.campusName}
                              campuses={p.campuses} />
          <Link to={"/unit/"+p.unitID}><img className="c-subheader__banner" src={"http://placehold.it/400x100?text="+p.unitID} alt={p.unitName} /></Link>
          <div className="c-subheader__buttons">
            <button className="o-button__3">Submit</button>
            <button className="o-button__3">Manage <span className="c-subheader__button-fragment">Submissions</span></button>
          </div>
        </div>
        <div className="c-subheader__row2">
          <Nav3Comp />
          <div className="c-subheader__social">
            <a href="">
              <img src="images/logo_facebook-black.svg" alt="Facebook"/>
            </a>
            <a href="">
              <img src="images/logo_twitter-black.svg" alt="Twitter"/>
            </a>
            <a href="">
              <img src="images/icon_rss-black.svg" alt="RSS"/>
            </a>
          </div>
          <div className="c-subheader__language">
            <a href="" className="o-textlink__primary">
              <abbr className="c-subheader__language-small-label" title="Español">ES</abbr>
              <span className="c-subheader__language-large-label">Español</span>
            </a>
            <a href="" className="o-textlink__primary">
              <abbr className="c-subheader__language-small-label" title="Português">PT</abbr>
              <span className="c-subheader__language-large-label">Português</span>
            </a>
          </div>
        </div>
      </div>
    )
  }
}

module.exports = Subheader2Comp;
