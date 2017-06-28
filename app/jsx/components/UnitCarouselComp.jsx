// ##### Unit Carousel Component ##### //

import React from 'react'
import $ from 'jquery'
import CarouselComp from '../components/CarouselComp.jsx'
// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class UnitCarouselComp extends React.Component {
  componentDidMount () {
    /* jquery dotdotdot */
    $('.o-unititem__title, .o-unititem__author').dotdotdot({
      watch: 'window'
    });
  }
  render() {
    return (
      <div className="o-itemcarousel">
        <h2 className="o-itemcarousel__heading">Center for Medieval and Renaissance Studies</h2>
        <CarouselComp className="c-unitcarousel o-itemcarousel__carousel"
                      options={{
                        cellAlign: 'left',
                        initialIndex: 0,
                        pageDots: false,
                        percentPosition: false // px instead of % cells
                      }}>
          <div className="o-itemcarousel__item">
            <a href="" className="o-unititem--vert">
              <div className="o-unititem__type--article">Article</div>
              <div className="o-unititem__title">Libero doloremque suscipit perferendis amet nostrum! Nostrum quisquam, tempore voluptatum ea dolor, hic esse adipisci reprehenderit ullam minima distinctio. Vero, molestias non.</div>
              <ul className="o-unititem__author">
                <li>Fung, Joe</li>
                <li>Wu, Abe</li>
                <li>Reed, Laura K</li>
                <li>Smith, Sheryl T</li>
                <li>Barshop, William</li>
                <li>Wong, Jeannette</li>
                <li>Dothager, Matthew</li>
                <li>Lee, Paul</li>
                <li>Wong, Jeannette</li>
              </ul>
            </a>
          </div>
          <div className="o-itemcarousel__item">
            <a href="" className="o-unititem--horz">
              <div className="o-unititem__type--book">Book</div>
              <div className="o-unititem__title">Sapiente pariatur voluptatibus, quisquam quam libero aspernatur esse dolorem, nisi voluptate accusantium consectetur temporibus maiores quis tempore. Non, architecto eveniet a laudantium.</div>
              <ul className="o-unititem__author">
                <li>Fung, Joe</li>
                <li>Wu, Abe</li>
                <li>Reed, Laura K</li>
                <li>Smith, Sheryl T</li>
                <li>Barshop, William</li>
                <li>Wong, Jeannette</li>
                <li>Dothager, Matthew</li>
                <li>Lee, Paul</li>
                <li>Wong, Jeannette</li>
              </ul>
            </a>
          </div>
          <div className="o-itemcarousel__item">
            <a href="" className="o-unititem--vert">
              <div className="o-unititem__type--multimedia">Multimedia</div>
              <div className="o-unititem__title">Libero doloremque suscipit perferendis amet nostrum! Nostrum quisquam, tempore voluptatum ea dolor, hic esse adipisci reprehenderit ullam minima distinctio. Vero, molestias non.</div>
              <ul className="o-unititem__author">
                <li>Fung, Joe</li>
                <li>Wu, Abe</li>
                <li>Reed, Laura K</li>
                <li>Smith, Sheryl T</li>
                <li>Barshop, William</li>
                <li>Wong, Jeannette</li>
                <li>Dothager, Matthew</li>
                <li>Lee, Paul</li>
                <li>Wong, Jeannette</li>
              </ul>
            </a>
          </div>
          <div className="o-itemcarousel__item">
            <a href="" className="o-unititem--horz">
              <div className="o-unititem__type--thesis">Thesis</div>
              <div className="o-unititem__title">Sapiente pariatur voluptatibus, quisquam quam libero aspernatur esse dolorem, nisi voluptate accusantium consectetur temporibus maiores quis tempore. Non, architecto eveniet a laudantium.</div>
              <ul className="o-unititem__author">
                <li>Fung, Joe</li>
                <li>Wu, Abe</li>
                <li>Reed, Laura K</li>
                <li>Smith, Sheryl T</li>
                <li>Barshop, William</li>
                <li>Wong, Jeannette</li>
                <li>Dothager, Matthew</li>
                <li>Lee, Paul</li>
                <li>Wong, Jeannette</li>
              </ul>
            </a>
          </div>
          <div className="o-itemcarousel__item">
            <a href="" className="o-unititem--vert">
              <div className="o-unititem__type--article">Article</div>
              <div className="o-unititem__title">Libero doloremque suscipit perferendis amet nostrum! Nostrum quisquam, tempore voluptatum ea dolor, hic esse adipisci reprehenderit ullam minima distinctio. Vero, molestias non.</div>
              <ul className="o-unititem__author">
                <li>Fung, Joe</li>
                <li>Wu, Abe</li>
                <li>Reed, Laura K</li>
                <li>Smith, Sheryl T</li>
                <li>Barshop, William</li>
                <li>Wong, Jeannette</li>
                <li>Dothager, Matthew</li>
                <li>Lee, Paul</li>
                <li>Wong, Jeannette</li>
              </ul>
            </a>
          </div>
        </CarouselComp>
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
