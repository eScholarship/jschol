// ##### Campus Carousel Component ##### //

import React from 'react'
import $ from 'jquery'

// Only load flickity when in the browser (not server-side)
if (!(typeof document === "undefined")) {
  var Flickity = require('flickity-imagesloaded')
}

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
  static propTypes = {
    campusName: React.PropTypes.string.isRequired,
  }
  render() {
    return (
      <div className="c-campuscarousel">
        <div className="c-campuscarousel__section">
          <h2 className="c-campuscarousel__cell-heading">
            {this.props.campusName}
          </h2>
          <div className="o-stat--item c-campuscarousel__cell">
            <b>24,844</b> Items
          </div>
          <div className="o-stat--view c-campuscarousel__cell">
            <b>380,941</b> Views
          </div>
          <div className="o-stat--passed c-campuscarousel__cell">
            <b>6,532</b> Items since UC OA Policy passed
          </div>
          <div className="o-stat--journals c-campuscarousel__cell">
            <b>31</b> eScholarship Journals
          </div>
          <div className="o-stat--units c-campuscarousel__cell">
            <b>119</b> Research Units
          </div>
        </div>
        <div className="c-campuscarousel__section">
          <h2 className="c-campuscarousel__cell-heading">
            All eScholarship
          </h2>
          <div className="o-stat--item c-campuscarousel__cell">
            <b>127,057</b> Items
          </div>
          <div className="o-stat--view c-campuscarousel__cell">
            <b>35,489,231</b> Views
          </div>
          <div className="o-stat--passed c-campuscarousel__cell">
            <b>31,750</b> Items since UC OA Policy passed
          </div>
          <div className="o-stat--journals c-campuscarousel__cell">
            <b>91</b> eScholarship Journals
          </div>
          <div className="o-stat--units c-campuscarousel__cell">
            <b>500</b> Research Units
          </div>
        </div>
      </div>
    )
  }
}

module.exports = CampusCarouselComp;
