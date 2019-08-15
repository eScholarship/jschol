// ##### Campus Carousel Component ##### //

import React from 'react'
import PropTypes from 'prop-types'
import CarouselComp from '../components/CarouselComp.jsx'
// import _ from 'lodash'

// let orderCampus = [ "item_count", "view_count", "journal_count", "oru_count" ]
// let orderAll = [ "all_item_count", "all_view_count", "all_journal_count", "all_oru_count" ]
// let classVal = { "item_count": "item", "view_count": "view", "journal_count": "journals",
//                  "oru_count": "units", "all_item_count": "item", "all_view_count": "view",
//                  "all_journal_count": "journals", "all_oru_count": "units" }

class CampusCarouselComp extends React.Component {
  static propTypes = {
    campusName: PropTypes.string.isRequired,
    campusID: PropTypes.string.isRequired,
    campusStats: PropTypes.shape({
      item_count: PropTypes.number,
      view_count: PropTypes.number,
      // opened_count: PropTypes.number,
      journal_count: PropTypes.number,
      oru_count: PropTypes.number,
    }).isRequired,
    allStats: PropTypes.shape({
      all_item_count: PropTypes.number,
      all_view_count: PropTypes.number,
      // all_opened_count: PropTypes.number,
      all_journal_count: PropTypes.number,
      all_oru_count: PropTypes.number,
    }).isRequired,
  }

  render() {
    // 90% of the way to making cell ordering easily configurable, but not necessary, so I stopped
    // let campusStats = 
    //  _.sortBy(_.map(this.props.campusStats, (value, key) => ({key, value})), function(o){ 
    //    return _.indexOf(orderCampus, o.key)
    //  })
    // let allStats =
    //    _.sortBy(_.map(this.props.allStats, (value, key) => ({key, value})), function(o){ 
    //     return _.indexOf(orderAll, o.key)
    //  })
    let c = this.props.campusStats
    let a = this.props.allStats
    let pluralJ = (c.journal_count == 1) ? '' : 's'
    let pluralU = (c.oru_count == 1) ? '' : 's'
    return (
      <CarouselComp className="c-statcarousel" options={{
          cellAlign: 'left',
          contain: true,
          initialIndex: 0,
          pageDots: false
        }}>
        <div className="c-statcarousel__section-heading">
          <h2>{this.props.campusName}</h2>
          <div className="o-stat--item c-statcarousel__cell">
            <a href={"/search?campuses="+this.props.campusID}>{c.item_count.toLocaleString()}</a> Items
          </div>
        </div>
      {c.view_count > 0 &&
        <div className="o-stat--view c-statcarousel__cell">
          <b>{c.view_count.toLocaleString()}</b> Views
        </div>
      }
      {/* <div className="o-stat--passed c-statcarousel__cell">
             <a href="">9,999</a> Items since UC <br/> OA Policy passed
          </div> */}
      {c.journal_count > 0 &&
        <div className="o-stat--journals c-statcarousel__cell">
           <a href={"/"+this.props.campusID+"/journals"}>{c.journal_count.toLocaleString()}</a> eScholarship Journal{pluralJ}
        </div>
      }
      {c.oru_count > 0 &&
        <div className="o-stat--units c-statcarousel__cell">
           <a href={"/"+this.props.campusID+"/units"}>{c.oru_count.toLocaleString()}</a> Research Unit{pluralU}
        </div>
      }
        <div className="c-statcarousel__section-heading">
          <h2>All eScholarship</h2>
          <div className="o-stat--item c-statcarousel__cell">
             <b>{a.all_item_count.toLocaleString()}</b> Items
          </div>
        </div>
        <div className="o-stat--view c-statcarousel__cell">
           <b>{a.all_view_count.toLocaleString()}</b> Views
        </div>
     {/*  <div className="o-stat--passed c-statcarousel__cell">
             <b>99,999</b> Items since UC <br/> OA Policy passed
          </div> */}
        <div className="o-stat--journals c-statcarousel__cell">
           <a href="/journals">{a.all_journal_count.toLocaleString()}</a> eScholarship Journals
        </div>
        <div className="o-stat--units c-statcarousel__cell">
           <b>{a.all_oru_count.toLocaleString()}</b> Research Units
        </div>
      </CarouselComp>
    )
  }
}

export default CampusCarouselComp;
