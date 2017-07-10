// ##### Campus Carousel Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import CarouselComp from '../components/CarouselComp.jsx'

class CampusCarouselComp extends React.Component {
  static propTypes = {
    campusName: PropTypes.string.isRequired,
  }
  render() {
    return (
      <CarouselComp className="c-statcarousel" options={{
          cellAlign: 'left',
          contain: true,
          initialIndex: 0,
          pageDots: false
        }}>
        <div className="c-statcarousel__section">
          <h2 className="c-statcarousel__cell-heading">
            {this.props.campusName}
          </h2>
          <div className="o-stat--item c-statcarousel__cell">
            <a href="">99,999</a> Items
          </div>
          <div className="o-stat--view c-statcarousel__cell">
            <a href="">999,999</a> Views
          </div>
          <div className="o-stat--passed c-statcarousel__cell">
             <a href="">9,999</a> Items since UC OA Policy passed
          </div>
          <div className="o-stat--journals c-statcarousel__cell">
             <a href="">99</a> eScholarship Journals
          </div>
          <div className="o-stat--units c-statcarousel__cell">
             <a href="">999</a> Research Units
          </div>
        </div>
        <div className="c-statcarousel__section">
          <h2 className="c-statcarousel__cell-heading">
            All eScholarship
          </h2>
          <div className="o-stat--item c-statcarousel__cell">
             <a href="">999,999</a> Items
          </div>
          <div className="o-stat--view c-statcarousel__cell">
             <a href="">99,999,999</a> Views
          </div>
          <div className="o-stat--passed c-statcarousel__cell">
             <a href="">99,999</a> Items since UC OA Policy passed
          </div>
          <div className="o-stat--journals c-statcarousel__cell">
             <a href="">99</a> eScholarship Journals
          </div>
          <div className="o-stat--units c-statcarousel__cell">
             <a href="">999</a> Research Units
          </div>
        </div>
      </CarouselComp>
    )
  }
}

module.exports = CampusCarouselComp;
