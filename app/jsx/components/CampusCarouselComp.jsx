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
      <CarouselComp className="c-campuscarousel" options={{
          cellAlign: 'left',
          contain: true,
          initialIndex: 0,
          pageDots: false
        }}>
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
      </CarouselComp>
    )
  }
}

module.exports = CampusCarouselComp;
