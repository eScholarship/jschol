// ##### Informational Pages Component ##### //

import React from 'react'
import $ from 'jquery'
import NotYetLink from '../components/NotYetLink.jsx'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class InfoPagesComp extends React.Component {
  componentDidMount() {
    $('.c-infopages__text').dotdotdot({watch:"window"});
  }
  render() {
    return (
      <div className="c-infopages">
        <div className="c-infopages__items">
          <div className="c-infopages__item">
            <h2>
              <NotYetLink element="a">eScholarship</NotYetLink>
              <NotYetLink className="c-infopages__title" element="a">About Us</NotYetLink>
            </h2>
            <div className="c-infopages__text">Coming soon: This row of results will link to general information relevant to your search (e.g. the eScholarship 'About Us' page).
            </div>
          </div>
          <div className="c-infopages__item">
            <h2>
              <NotYetLink element="a">California Italian Studies</NotYetLink>
              <NotYetLink element="a" className="c-infopages__title">Call for Papers</NotYetLink>
            </h2>
            <div className="c-infopages__text">Coming soon: This row of results will link to general information relevant to your search (e.g. a journal's Call for Papers page).
            </div>
          </div>
          <div className="c-infopages__item">
            <h2>
              <NotYetLink element="a">Western Journal of Emergency Medicine</NotYetLink>
              <NotYetLink element="a" className="c-infopages__title">Journal Home</NotYetLink>
            </h2>
            <div className="c-infopages__text">Coming soon: This row of results will link to general information relevant to your search (e.g. a journal's homepage).
            </div>
          </div>
        </div>
        <NotYetLink element="a" className="c-infopages__all">Show all informational page results</NotYetLink>
      </div>
    )
  }
}

module.exports = InfoPagesComp;
