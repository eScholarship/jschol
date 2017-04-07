// ##### Informational Pages Component ##### //

import React from 'react'
import $ from 'jquery'
import dotdotdot from 'jquery.dotdotdot'

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
              <a href="">The Center for Environmental Design Research</a>
              <a href="" className="c-infopages__title">In the Press</a>
            </h2>
            <div className="c-infopages__text">The University of California awards contract to Symplectic for the implementation of a publication harvesting system to support UC’s Open Access Policy" March, 2014
            </div>
          </div>
          <div className="c-infopages__item">
            <h2>
              <a href="">eScholarship</a>
              <a href="" className="c-infopages__title">Lorem Ipsum Dolor Sit Amet</a>
            </h2>
            <div className="c-infopages__text">Debitis incidunt aliquam nemo iure alias, amet rerum velit quidem. Quia, provident voluptatum earum mollitia aliquam at nulla quam, sunt! Laboriosam est perspiciatis molestias excepturi ad repellendus.
            </div>
          </div>
          <div className="c-infopages__item">
            <h2>
              <a href="">UC Berkeley</a>
              <a href="" className="c-infopages__title">Consectetur Adipisicing Elit Delectus Veritatis Mollitia</a>
            </h2>
            <div className="c-infopages__text">eScholarship provides open access, scholarly publishing services to the University of California and delivers a dynamic research platform to scholars worldwide.
            </div>
          </div>
        </div>
        <a href="" className="c-infopages__all">Show all informational page results</a>
      </div>
    )
  }
}

module.exports = InfoPagesComp;
