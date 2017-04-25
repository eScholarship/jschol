// ##### Campus Carousel Component ##### //

import React from 'react'
import $ from 'jquery'
import Flickity from 'flickity-imagesloaded'

class CampusCarouselComp extends React.Component {
  componentDidMount () {
    var carousel = $('.c-campuscarousel')[0];
    var options = {
      cellAlign: 'left',
      contain: true,
      initialIndex: 0,
      pageDots: false
    }
    this.flkty = new Flickity(carousel, options);
  }
  componentWillUnmount() {
    if (this.flkty) {
      this.flkty.destroy();
    }
  }
  render() {
    return (
      <div className="c-campuscarousel">
        <div className="c-campuscarousel__section">
          <h2 className="c-campuscarousel__cell-heading">
            UC Berkeley
          </h2>
          <div className="c-campuscarousel__cell--item">
            <strong>24,844</strong> Items
          </div>
          <div className="c-campuscarousel__cell--view">
            <strong>380,941</strong> Views
          </div>
          <div className="c-campuscarousel__cell--passed">
            <strong>6,532</strong> Items since UC OA Policy passed
          </div>
          <div className="c-campuscarousel__cell--journals">
            <strong>31</strong> eScholarship Journals
          </div>
          <div className="c-campuscarousel__cell--units">
            <strong>119</strong> Research Units
          </div>
        </div>
        <div className="c-campuscarousel__section">
          <h2 className="c-campuscarousel__cell-heading">
            All eScholarship
          </h2>
          <div className="c-campuscarousel__cell--item">
            <strong>127,057</strong> Items
          </div>
          <div className="c-campuscarousel__cell--view">
            <strong>35,489,231</strong> Views
          </div>
          <div className="c-campuscarousel__cell--passed">
            <strong>31,750</strong> Items since UC OA Policy passed
          </div>
          <div className="c-campuscarousel__cell--journals">
            <strong>91</strong> eScholarship Journals
          </div>
          <div className="c-campuscarousel__cell--units">
            <strong>500</strong> Research Units
          </div>
        </div>
      </div>
    )
  }
}

module.exports = CampusCarouselComp;
