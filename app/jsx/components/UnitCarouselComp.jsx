// ##### Unit Carousel Component ##### //

import React from 'react'
import $ from 'jquery'
import PropTypes from 'prop-types'
import CarouselComp from '../components/CarouselComp.jsx'

// Load dotdotdot in browser but not server
if (!(typeof document === "undefined")) {
  const dotdotdot = require('jquery.dotdotdot')
}

class UnitCarouselItem extends React.Component {
  static propTypes = {
    orientation: PropTypes.string.isRequired,
    result: PropTypes.shape({
      id: PropTypes.string,
      genre: PropTypes.string,
      title: PropTypes.string,
      authors: PropTypes.array,
    }).isRequired,
  }
  render() {
    let p = this.props.result
    return (
      <div className="o-itemcarousel__item">
          <a href="" className={"o-unititem--" + this.props.orientation}>
            <div className="o-unititem__type--article">{p.genre}</div>
            <div className="o-unititem__title">{p.title}</div>
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
    )
  }
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
          { data.unitItems.map((result, i) =>
            <UnitCarouselItem key={i} orientation={(i+1)%2 ? 'vert':'horz'} result={result} />)
          }
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
