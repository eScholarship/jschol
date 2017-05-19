// ##### Item Carousel Component ##### //

import React from 'react'
import $ from 'jquery'
import Flickity from 'flickity-imagesloaded'

class ItemCarouselComp extends React.Component {
  componentDidMount () {
    var carousel = $('.c-itemcarousel__carousel')[0];
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
      <div className="c-itemcarousel">
        <div className="c-itemcarousel__carousel">
          <div className="c-itemcarousel__item">
            Item 1
          </div>
          <div className="c-itemcarousel__item">
            Item 2
          </div>
          <div className="c-itemcarousel__item">
            Item 3
          </div>
        </div>
        <div className="c-itemcarousel__stats">
          [item/view stats to go here]
        </div>
      </div>
    )
  }
}

module.exports = ItemCarouselComp;
