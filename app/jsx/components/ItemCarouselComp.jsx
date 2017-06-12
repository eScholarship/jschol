// ##### Item Carousel Component ##### //

import React from 'react'
import CarouselComp from '../components/CarouselComp.jsx'

class ItemCarouselComp extends React.Component {
  render() {
    return (
      <div className="c-itemcarousel">
        <CarouselComp className="c-itemcarousel__carousel" options={{
            cellAlign: 'left',
            contain: true,
            initialIndex: 0,
            pageDots: false
          }}>
          <div className="c-itemcarousel__item">
            Item 1
          </div>
          <div className="c-itemcarousel__item">
            Item 2
          </div>
          <div className="c-itemcarousel__item">
            Item 3
          </div>
          <div className="c-itemcarousel__item">
            Item 4
          </div>
          <div className="c-itemcarousel__item">
            Item 5
          </div>
        </div>
        <div className="o-stat--item c-itemcarousel__stats-item">
          <b>1,000</b>Items
        </div>
        <div className="o-stat--view c-itemcarousel__stats-view">
          <b>100,000</b>Views
        </div>
      </CarouselComp>
    )
  }
}

module.exports = ItemCarouselComp;
