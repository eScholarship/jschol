// ##### Journal Carousel Component ##### //

import React from 'react'
import $ from 'jquery'
import Flickity from 'flickity-imagesloaded'
import dotdotdot from 'jquery.dotdotdot'

class UnitCarouselComp extends React.Component {
  componentDidMount () {
    var carousel = $('.c-journalcarousel')[0];
    var options = {
      cellAlign: 'left',
      initialIndex: 0,
      pageDots: false,
      imagesLoaded: true,
      percentPosition: false, // px instead of % cells
    }
    this.flkty = new Flickity(carousel, options);

    /* jquery dotdotdot */
    $('.o-journal2 figcaption').dotdotdot({
      watch: 'window'
    });
  }
  componentWillUnmount() {
    if (this.flkty) {
      this.flkty.destroy();
    }
  }
  render() {
    return (
      <div className="o-itemcarousel">
        <h2 className="o-itemcarousel__heading">UC Berkeley Journals</h2>
        <div className="c-journalcarousel o-itemcarousel__carousel">
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
        </div>
        <div className="o-stat--item o-itemcarousel__stats-item">
          <b>1,000</b>Items
        </div>
        <div className="o-stat--view o-itemcarousel__stats-view">
          <b>100,000</b>Views
        </div>
      </div>
    )
  }
}

module.exports = UnitCarouselComp;
