// ##### Journal Carousel Component ##### //

import React from 'react'
import $ from 'jquery'
import CarouselComp from '../components/CarouselComp.jsx'
import { Link } from 'react-router'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class JournalCarouselComp extends React.Component {
  componentDidMount () {
    /* jquery dotdotdot */
    $('.o-journal2 figcaption').dotdotdot({
      watch: 'window'
    });
  }
  render() {
    return (
      <div className="o-itemcarousel">
        <h2 className="o-itemcarousel__heading"><Link to={"/" + this.props.campusID + "/journals"}>{this.props.campusName} Journals</Link></h2>
        <CarouselComp className="c-journalcarousel o-itemcarousel__carousel" 
                      options={{
                        cellAlign: 'left',
                        initialIndex: 0,
                        pageDots: false,
                        imagesLoaded: true,
                        percentPosition: false // px instead of % cells
                      }}>
          <div className="o-itemcarousel__item">
            <a href="" className="o-journal2">
              <figure>
                <img src="http://escholarship.org/issueCovers/jmie_sfews/15_01_cover.png" alt=""/>
                <figcaption>The Proceedings of the UCLA Department of Spanish and Portuguese Graduate Conference</figcaption>
              </figure>
            </a>
          </div>
          <div className="o-itemcarousel__item">
            <a href="" className="o-journal2">
              <figure>
                <img src="http://escholarship.org/issueCovers/ucdavislibrary_streetnotes/25_00_cover.png" alt=""/>
                <figcaption>streetnotes</figcaption>
              </figure>
            </a>
          </div>
          <div className="o-itemcarousel__item">
            <a href="" className="o-journal2">
              <figure>
                <img src="http://escholarship.org/issueCovers/ucbgse_bre/06_02_cover.png" alt=""/>
                <figcaption>Maiores Corporis Repellendus Maxime</figcaption>
              </figure>
            </a>
          </div>
          <div className="o-itemcarousel__item">
            <a href="" className="o-journal2">
              <figure>
                <img src="http://escholarship.org/issueCovers/regeneracion_tlacuilolli/02_01_cover.png" alt=""/>
                <figcaption>The Proceedings of the UCLA Department of Spanish and Portuguese Graduate Conference</figcaption>
              </figure>
            </a>
          </div>
          <div className="o-itemcarousel__item">
            <a href="" className="o-journal2">
              <figure>
                <img src="http://escholarship.org/issueCovers/jmie_sfews/15_01_cover.png" alt=""/>
                <figcaption>The Proceedings of the UCLA Department of Spanish and Portuguese Graduate Conference</figcaption>
              </figure>
            </a>
          </div>
        </CarouselComp>
        <div className="o-stat--item o-itemcarousel__stats-item">
          <Link to={"/" + this.props.campusID + "/journals"}>9,999</Link>Items
        </div>
        <div className="o-stat--view o-itemcarousel__stats-view">
          <b>999,999</b>Views
        </div>
      </div>
    )
  }
}

module.exports = JournalCarouselComp;
